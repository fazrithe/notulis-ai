// ---------------------------------------------------------------------------
// Deteksi gender suara sederhana berbasis pitch (frekuensi fundamental).
//
// Ini BUKAN model machine learning — ini heuristik ringan (autocorrelation
// pitch detection + ambang batas frekuensi) yang berjalan 100% di browser,
// tanpa API tambahan. Cukup baik untuk memberi TEBAKAN AWAL label
// "Bapak"/"Ibu" yang tetap bisa diedit manual oleh pengguna.
//
// Untuk akurasi produksi yang lebih tinggi, ganti fungsi ini dengan
// pemanggilan model klasifikasi gender-dari-suara (mis. model Hugging Face)
// di server — lihat catatan di README/MIGRATION.md.
// ---------------------------------------------------------------------------

import type { SpeakerGender } from "@/lib/types";

const MALE_FEMALE_THRESHOLD_HZ = 165; // ambang umum antara F0 pria & wanita
const MIN_PITCH_HZ = 70;
const MAX_PITCH_HZ = 400;

/** Algoritma autocorrelation (ACF2+) untuk estimasi pitch dari satu frame audio. */
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // terlalu senyap / hening

  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < threshold) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  const trimmed = buf.slice(r1, r2);
  const SIZE2 = trimmed.length;
  if (SIZE2 < 8) return -1;

  const c = new Array(SIZE2).fill(0) as number[];
  for (let i = 0; i < SIZE2; i++) {
    for (let j = 0; j < SIZE2 - i; j++) {
      c[i] += trimmed[j] * trimmed[j + i];
    }
  }

  let d = 0;
  while (d < SIZE2 - 1 && c[d] > c[d + 1]) d++;

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < SIZE2; i++) {
    if (c[i] > maxVal) {
      maxVal = c[i];
      maxPos = i;
    }
  }
  if (maxPos <= 0 || maxPos >= SIZE2 - 1) return -1;

  const T0raw = maxPos;
  const x1 = c[T0raw - 1];
  const x2 = c[T0raw];
  const x3 = c[T0raw + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const T0 = a ? T0raw - b / (2 * a) : T0raw;

  if (T0 <= 0) return -1;
  const freq = sampleRate / T0;
  if (freq < MIN_PITCH_HZ || freq > MAX_PITCH_HZ) return -1;
  return freq;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface GenderEstimate {
  gender: SpeakerGender;
  confidence: number;
  medianPitchHz: number | null;
}

/**
 * Estimasi gender dari satu rentang buffer audio (mono Float32Array + sampleRate).
 * Membagi buffer menjadi frame ~46ms dan mengambil median pitch valid.
 */
export function estimateGenderFromSamples(samples: Float32Array, sampleRate: number): GenderEstimate {
  const frameSize = 2048;
  const hop = 1024;
  const pitches: number[] = [];

  for (let start = 0; start + frameSize < samples.length; start += hop) {
    const frame = samples.subarray(start, start + frameSize);
    const pitch = autoCorrelate(frame as Float32Array, sampleRate);
    if (pitch > 0) pitches.push(pitch);
  }

  if (pitches.length < 3) {
    return { gender: "unknown", confidence: 0, medianPitchHz: null };
  }

  const medianPitch = median(pitches);
  const distance = Math.abs(medianPitch - MALE_FEMALE_THRESHOLD_HZ);
  const confidence = Math.max(0.5, Math.min(0.97, 0.55 + distance / 220));

  return {
    gender: medianPitch < MALE_FEMALE_THRESHOLD_HZ ? "male" : "female",
    confidence: Number(confidence.toFixed(2)),
    medianPitchHz: Math.round(medianPitch),
  };
}

interface SegmentRange {
  speakerRawLabel: string;
  startSec: number;
  endSec: number;
}

/**
 * Mendekode audioBlob lalu mengelompokkan sample per speaker (maks ~6 detik
 * per speaker demi performa), lalu menjalankan estimasi gender untuk tiap
 * speaker. Dijalankan di browser (butuh AudioContext).
 */
export async function estimateSpeakerGenders(
  audioBlob: Blob,
  segments: SegmentRange[]
): Promise<Map<string, GenderEstimate>> {
  const result = new Map<string, GenderEstimate>();
  if (!segments.length) return result;

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const channel = decoded.getChannelData(0);
    const sampleRate = decoded.sampleRate;

    const bySpeaker = new Map<string, SegmentRange[]>();
    for (const seg of segments) {
      const list = bySpeaker.get(seg.speakerRawLabel) ?? [];
      list.push(seg);
      bySpeaker.set(seg.speakerRawLabel, list);
    }

    for (const [speaker, segs] of bySpeaker.entries()) {
      const chunks: Float32Array[] = [];
      let collectedSec = 0;
      for (const seg of segs) {
        if (collectedSec >= 6) break;
        const startSample = Math.max(0, Math.floor(seg.startSec * sampleRate));
        const endSample = Math.min(channel.length, Math.floor(seg.endSec * sampleRate));
        if (endSample <= startSample) continue;
        chunks.push(channel.subarray(startSample, endSample));
        collectedSec += (endSample - startSample) / sampleRate;
      }
      if (!chunks.length) {
        result.set(speaker, { gender: "unknown", confidence: 0, medianPitchHz: null });
        continue;
      }
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      result.set(speaker, estimateGenderFromSamples(merged, sampleRate));
    }
  } finally {
    ctx.close().catch(() => {});
  }

  return result;
}
