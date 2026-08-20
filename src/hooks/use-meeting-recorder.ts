"use client";

import * as React from "react";

export type RecorderPhase = "idle" | "recording" | "stopping" | "stopped";

export interface LiveSegmentPreview {
  speakerRawLabel: string;
  text: string;
  startSec: number;
  endSec: number;
}

interface UseMeetingRecorderOptions {
  /**
   * Dipanggil tiap kali percakapan berhenti sejenak (jeda), dan paling lambat
   * tiap ~25 detik bila peserta bicara terus tanpa jeda.
   */
  onPartialPreview?: (segments: LiveSegmentPreview[]) => void;
}

/** Cadangan: dipakai kalau tidak ada jeda sama sekali. */
const PARTIAL_PREVIEW_INTERVAL_MS = 25_000;
/** Seberapa sering level mikrofon dicek untuk mendeteksi jeda. */
const LEVEL_POLL_MS = 120;
/** RMS di atas ini dianggap ada yang sedang bicara. */
const SPEECH_RMS = 0.04;
/** RMS di bawah ini dianggap sunyi (di antara keduanya = ambang ragu, diabaikan). */
const SILENCE_RMS = 0.02;
/** Lama sunyi berturut-turut sebelum dianggap sebagai jeda percakapan. */
const SILENCE_HOLD_MS = 800;
/** Jarak minimum antar permintaan pratinjau supaya API tidak dibanjiri. */
const MIN_PREVIEW_GAP_MS = 7_000;
/** Audio yang terlalu pendek hampir selalu gagal ditranskrip. */
const MIN_AUDIO_MS = 4_000;

function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

export function useMeetingRecorder({ onPartialPreview }: UseMeetingRecorderOptions) {
  const [phase, setPhase] = React.useState<RecorderPhase>("idle");
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [analyser, setAnalyser] = React.useState<AnalyserNode | null>(null);
  const [previewPending, setPreviewPending] = React.useState(false);

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const partialIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const pauseWatchRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const partialInFlightRef = React.useRef(false);
  const speechSincePreviewRef = React.useRef(false);
  const silenceSinceRef = React.useRef<number | null>(null);
  const lastPreviewAtRef = React.useRef(0);
  const startedAtRef = React.useRef<number>(0);
  const mimeTypeRef = React.useRef<string>("");

  const cleanupTimers = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (partialIntervalRef.current) clearInterval(partialIntervalRef.current);
    if (pauseWatchRef.current) clearInterval(pauseWatchRef.current);
    timerRef.current = null;
    partialIntervalRef.current = null;
    pauseWatchRef.current = null;
  }, []);

  const fetchPartialPreview = React.useCallback(async () => {
    if (partialInFlightRef.current || chunksRef.current.length === 0 || !onPartialPreview) return;
    if (Date.now() - startedAtRef.current < MIN_AUDIO_MS) return;
    partialInFlightRef.current = true;
    speechSincePreviewRef.current = false;
    lastPreviewAtRef.current = Date.now();
    setPreviewPending(true);
    try {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" });
      const formData = new FormData();
      formData.append("audio", blob, "partial.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await res.json();
      if (data.ok) onPartialPreview(data.segments);
    } catch {
      // Pratinjau gagal, biarkan saja — transkrip final tetap akan dibuat saat "Selesai".
    } finally {
      partialInFlightRef.current = false;
      // Jarak antar permintaan dihitung dari saat permintaan sebelumnya
      // selesai, bukan saat dimulai.
      lastPreviewAtRef.current = Date.now();
      setPreviewPending(false);
    }
  }, [onPartialPreview]);

  /**
   * Mendengarkan level mikrofon lewat analyser. Begitu ada jeda (sunyi
   * berturut-turut selama SILENCE_HOLD_MS setelah seseorang bicara),
   * pratinjau langsung diminta tanpa menunggu timer 25 detik.
   */
  const watchForPause = React.useCallback(
    (analyserNode: AnalyserNode) => {
      const buffer = new Uint8Array(analyserNode.fftSize);
      return setInterval(() => {
        analyserNode.getByteTimeDomainData(buffer);
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const deviation = (buffer[i] - 128) / 128;
          sumSquares += deviation * deviation;
        }
        const rms = Math.sqrt(sumSquares / buffer.length);

        if (rms >= SPEECH_RMS) {
          speechSincePreviewRef.current = true;
          silenceSinceRef.current = null;
          return;
        }
        // Belum cukup sunyi, atau belum ada kalimat baru sejak pratinjau terakhir.
        if (rms > SILENCE_RMS || !speechSincePreviewRef.current) return;

        const now = Date.now();
        silenceSinceRef.current ??= now;
        if (now - silenceSinceRef.current < SILENCE_HOLD_MS) return;
        if (now - lastPreviewAtRef.current < MIN_PREVIEW_GAP_MS) return;

        silenceSinceRef.current = null;
        void fetchPartialPreview();
      }, LEVEL_POLL_MS);
    },
    [fetchPartialPreview]
  );

  const start = React.useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      const mimeType = pickMimeType();
      mimeTypeRef.current = mimeType;
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;

      startedAtRef.current = Date.now();
      setElapsedSec(0);
      timerRef.current = setInterval(() => {
        setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);

      if (onPartialPreview) {
        speechSincePreviewRef.current = false;
        silenceSinceRef.current = null;
        lastPreviewAtRef.current = 0;
        pauseWatchRef.current = watchForPause(analyserNode);
        partialIntervalRef.current = setInterval(fetchPartialPreview, PARTIAL_PREVIEW_INTERVAL_MS);
      }

      setPhase("recording");
    } catch {
      setError("Tidak dapat mengakses mikrofon. Pastikan izin mikrofon browser sudah diberikan.");
    }
  }, [fetchPartialPreview, onPartialPreview, watchForPause]);

  const stop = React.useCallback((): Promise<{ blob: Blob; durationSec: number; mimeType: string }> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      cleanupTimers();
      setPhase("stopping");
      setPreviewPending(false);

      if (!recorder) {
        resolve({ blob: new Blob(), durationSec: 0, mimeType: mimeTypeRef.current });
        return;
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || "audio/webm" });
        const durationSec = Math.floor((Date.now() - startedAtRef.current) / 1000);

        streamRef.current?.getTracks().forEach((t) => t.stop());
        audioCtxRef.current?.close().catch(() => {});
        setAnalyser(null);
        setPhase("stopped");

        resolve({ blob, durationSec, mimeType: mimeTypeRef.current || "audio/webm" });
      };
      recorder.stop();
    });
  }, [cleanupTimers]);

  React.useEffect(() => {
    return () => {
      cleanupTimers();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close().catch(() => {});
    };
  }, [cleanupTimers]);

  const reset = React.useCallback(() => {
    setPhase("idle");
    setElapsedSec(0);
    setError(null);
    setPreviewPending(false);
    chunksRef.current = [];
    speechSincePreviewRef.current = false;
    silenceSinceRef.current = null;
    lastPreviewAtRef.current = 0;
  }, []);

  return { phase, elapsedSec, error, analyser, previewPending, start, stop, reset };
}
