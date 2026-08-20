"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Check, FileText, Loader2, Mic, Pencil, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AudioWaveform } from "@/components/agenda/audio-waveform";
import { ApiKeyRequiredDialog } from "@/components/api-key/api-key-required-dialog";
import { useApiKeyGuard } from "@/hooks/use-api-key-guard";
import { useMeetingRecorder, type LiveSegmentPreview } from "@/hooks/use-meeting-recorder";
import { PROVIDER_LABEL } from "@/lib/ai/roles";
import { estimateSpeakerGenders } from "@/lib/audio/pitch";
import { speakerColor } from "@/lib/speaker-colors";
import { formatDateID, formatDuration, formatTimeID } from "@/lib/utils";
import type { Meeting, Speaker, TranscriptSegment } from "@/lib/types";

type Stage = "siap" | "merekam" | "memproses" | "tinjau" | "meringkas" | "selesai" | "error";

function rid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function RecordingDialog({
  meeting: initialMeeting,
  open,
  onOpenChange,
  onCompleted,
}: {
  meeting: Meeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: (meeting: Meeting) => void;
}) {
  const [meeting, setMeeting] = React.useState(initialMeeting);
  const [stage, setStage] = React.useState<Stage>("siap");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [livePreview, setLivePreview] = React.useState<LiveSegmentPreview[]>([]);
  const finalBlobRef = React.useRef<Blob | null>(null);

  // Reset dialog state whenever it's (re)opened for a (different) meeting.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setMeeting(initialMeeting);
      setStage("siap");
      setErrorMessage(null);
      setLivePreview([]);
    }
  }, [open, initialMeeting]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const { missing, checking, ensureApiKeysReady, dismissMissing, reportMissing } = useApiKeyGuard();
  const recorder = useMeetingRecorder({
    onPartialPreview: (segments) => setLivePreview(segments),
  });

  async function handleStart() {
    // Penjaga terakhir sebelum mikrofon diakses: kedua API key harus siap.
    if (!(await ensureApiKeysReady())) return;

    await recorder.start();
    const startTime = new Date().toISOString();
    setMeeting((m) => ({ ...m, status: "berlangsung", startTime }));
    setStage("merekam");
    fetch(`/api/meetings/${meeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "berlangsung", startTime }),
    }).catch(() => {});
  }

  async function processTranscript(blob: Blob, durationSec: number) {
    setStage("memproses");
    setErrorMessage(null);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "rekaman.webm");
      formData.append("meetingId", meeting.id);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.code === "missing_api_key") reportMissing(data.missing);
        throw new Error(data.message || "Gagal memproses transkripsi.");
      }

      const rawSegments: {
        speakerRawLabel: string;
        text: string;
        startSec: number;
        endSec: number;
      }[] = data.segments;

      if (!rawSegments.length) {
        throw new Error("Tidak ada percakapan yang terdeteksi dalam rekaman ini.");
      }

      let genderMap = new Map<string, { gender: "male" | "female" | "unknown"; confidence: number }>();
      try {
        genderMap = await estimateSpeakerGenders(blob, rawSegments);
      } catch {
        // Deteksi gender gagal (mis. format audio tidak didukung browser) — lanjut dengan default.
      }

      const uniqueLabels = Array.from(new Set(rawSegments.map((s) => s.speakerRawLabel)));
      const speakers: Speaker[] = uniqueLabels.map((rawLabel, index) => {
        const estimate = genderMap.get(rawLabel);
        const gender =
          estimate?.gender && estimate.gender !== "unknown" ? estimate.gender : index % 2 === 0 ? "male" : "female";
        const talkTimeSec = rawSegments
          .filter((s) => s.speakerRawLabel === rawLabel)
          .reduce((sum, s) => sum + (s.endSec - s.startSec), 0);
        return {
          id: rid("spk"),
          rawLabel,
          displayName: gender === "male" ? "Bapak" : "Ibu",
          gender,
          genderConfidence: estimate?.confidence,
          talkTimeSec: Math.round(talkTimeSec),
          colorIndex: index,
        };
      });

      const speakerIdByLabel = new Map(speakers.map((s) => [s.rawLabel, s.id]));
      const transcript: TranscriptSegment[] = rawSegments.map((s) => ({
        id: rid("seg"),
        speakerId: speakerIdByLabel.get(s.speakerRawLabel)!,
        text: s.text,
        startSec: s.startSec,
        endSec: s.endSec,
      }));

      const endTime = new Date().toISOString();
      const patchRes = await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          speakers,
          transcript,
          status: "diproses",
          endTime,
          durationSec,
          assemblyaiTranscriptId: data.assemblyaiTranscriptId ?? null,
        }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok || !patchData.ok) throw new Error("Gagal menyimpan hasil transkripsi.");

      setMeeting(patchData.meeting);
      setStage("tinjau");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan saat memproses transkripsi.");
      setStage("error");
    }
  }

  async function handleStop() {
    const { blob, durationSec } = await recorder.stop();
    finalBlobRef.current = blob;
    await processTranscript(blob, durationSec);
  }

  async function handleRetryTranscribe() {
    if (!finalBlobRef.current) return;
    const durationSec = meeting.durationSec || Math.floor(finalBlobRef.current.size / 4000);
    await processTranscript(finalBlobRef.current, durationSec);
  }

  function updateSpeakerName(speakerId: string, name: string) {
    setMeeting((m) => ({
      ...m,
      speakers: m.speakers.map((s) => (s.id === speakerId ? { ...s, displayName: name } : s)),
    }));
  }

  async function persistSpeakerNames() {
    await fetch(`/api/meetings/${meeting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speakers: meeting.speakers }),
    }).catch(() => {});
  }

  async function handleGenerateSummary() {
    setStage("meringkas");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.code === "missing_api_key") reportMissing(data.missing);
        throw new Error(data.message || "Gagal membuat kesimpulan rapat.");
      }
      setMeeting(data.meeting);
      setStage("selesai");
      onCompleted(data.meeting);
      toast.success("Kesimpulan rapat berhasil dibuat");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat kesimpulan rapat.");
      setStage("tinjau");
    }
  }

  const speakerColorByLabel = React.useMemo(() => {
    const uniqueLabels = Array.from(new Set(livePreview.map((s) => s.speakerRawLabel)));
    const map = new Map<string, number>();
    uniqueLabels.forEach((label, i) => map.set(label, i));
    return map;
  }, [livePreview]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v && (stage === "merekam" || stage === "memproses" || stage === "meringkas")) {
            toast.info("Selesaikan atau hentikan rekaman terlebih dahulu.");
            return;
          }
          onOpenChange(v);
        }}
      >
        <DialogContent showCloseButton={stage !== "merekam"} className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="size-4.5 text-primary" />
              {meeting.title}
            </DialogTitle>
            <DialogDescription>
              {formatDateID(meeting.date)}
              {meeting.startTime ? ` · Mulai ${formatTimeID(meeting.startTime)}` : ""}
              {meeting.location ? ` · ${meeting.location}` : ""}
            </DialogDescription>
          </DialogHeader>

          {stage === "siap" && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mic className="size-9" />
              </span>
              <div>
                <p className="font-medium">Siap merekam rapat ini?</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Rekaman akan otomatis diberi cap tanggal &amp; jam mulai. Pastikan mikrofon Anda aktif.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Transkrip &amp; pemisahan pembicara oleh {PROVIDER_LABEL.assemblyai} · kesimpulan oleh{" "}
                  {PROVIDER_LABEL.gemini}
                </p>
              </div>
              <Button variant="brand" size="lg" disabled={checking} onClick={handleStart}>
                {checking ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
                Mulai Rekam
              </Button>
            </div>
          )}

          {stage === "merekam" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex size-3">
                    <span className="absolute inline-flex size-3 animate-pulse-ring rounded-full bg-destructive" />
                    <span className="relative inline-flex size-3 rounded-full bg-destructive" />
                  </span>
                  <span className="text-sm font-medium">Sedang merekam...</span>
                </div>
                <span className="font-mono text-lg font-semibold tabular-nums">
                  {formatDuration(recorder.elapsedSec)}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <AudioWaveform analyser={recorder.analyser} active={stage === "merekam"} />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Hasil Percakapan (pratinjau berjalan)
                  </p>
                  {recorder.previewPending && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      Memperbarui...
                    </span>
                  )}
                </div>
                <ScrollArea className="h-48 rounded-xl border border-border bg-muted/20 p-3">
                  {livePreview.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      Pratinjau transkrip muncul di sini begitu percakapan berhenti sejenak.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {livePreview.map((seg, i) => {
                        const color = speakerColor(speakerColorByLabel.get(seg.speakerRawLabel) ?? 0);
                        return (
                          <div key={i} className="flex gap-2.5 text-sm">
                            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${color.dot}`} />
                            <p>
                              <span className={`font-medium ${color.text}`}>{seg.speakerRawLabel}: </span>
                              <span className="text-foreground/90">{seg.text}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <Button variant="destructive" size="lg" className="w-full" onClick={handleStop}>
                <Square className="size-4" />
                Selesai Rekam
              </Button>
            </div>
          )}

          {stage === "memproses" && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Loader2 className="size-9 animate-spin text-primary" />
              <div>
                <p className="font-medium">Memproses transkrip &amp; mendeteksi pembicara...</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sedang mengirim audio ke {PROVIDER_LABEL.assemblyai} untuk transkripsi &amp; pemisahan pembicara, lalu
                  menganalisis suara Bapak/Ibu. Ini bisa memakan waktu beberapa saat tergantung durasi rapat.
                </p>
              </div>
            </div>
          )}

          {stage === "error" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-7" />
              </span>
              <div>
                <p className="font-medium">Gagal memproses transkrip</p>
                <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <Button variant="outline" onClick={handleRetryTranscribe}>
                Coba Lagi
              </Button>
            </div>
          )}

          {(stage === "tinjau" || stage === "meringkas") && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  <Pencil className="size-3.5" />
                  Pembicara Terdeteksi — klik nama untuk mengganti
                </p>
                <div className="flex flex-wrap gap-2">
                  {meeting.speakers.map((sp) => {
                    const color = speakerColor(sp.colorIndex);
                    return (
                      <div
                        key={sp.id}
                        className={`flex items-center gap-1.5 rounded-full border border-border ${color.bg} py-1 pr-1 pl-2.5`}
                      >
                        <span className={`size-2 rounded-full ${color.dot}`} />
                        <Input
                          value={sp.displayName}
                          onChange={(e) => updateSpeakerName(sp.id, e.target.value)}
                          onBlur={persistSpeakerNames}
                          className="h-6 w-32 border-none bg-transparent px-1 text-xs shadow-none focus-visible:ring-1"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Transkrip Percakapan
                </p>
                <ScrollArea className="h-56 rounded-xl border border-border bg-muted/20 p-3">
                  <div className="space-y-3">
                    {meeting.transcript.map((seg) => {
                      const sp = meeting.speakers.find((s) => s.id === seg.speakerId);
                      const color = speakerColor(sp?.colorIndex ?? 0);
                      return (
                        <div key={seg.id} className="flex gap-2.5 text-sm">
                          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${color.dot}`} />
                          <p>
                            <span className={`font-medium ${color.text}`}>{sp?.displayName ?? "Peserta"}: </span>
                            <span className="text-foreground/90">{seg.text}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <Button
                variant="brand"
                size="lg"
                className="w-full"
                disabled={stage === "meringkas"}
                onClick={handleGenerateSummary}
              >
                {stage === "meringkas" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {stage === "meringkas" ? "Membuat kesimpulan..." : "Buat Kesimpulan Rapat"}
              </Button>
              <p className="-mt-1 text-center text-xs text-muted-foreground">
                Kesimpulan dibuat oleh {PROVIDER_LABEL.gemini} dari transkrip {PROVIDER_LABEL.assemblyai} di atas.
              </p>
            </div>
          )}

          {stage === "selesai" && meeting.summary && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm text-success">
                <Check className="size-4" />
                Notulen dan kesimpulan rapat berhasil dibuat.
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm leading-relaxed text-foreground/90">{meeting.summary.overview}</p>
                {meeting.summary.decisions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Keputusan</p>
                    <ul className="mt-1.5 space-y-1 text-sm">
                      {meeting.summary.decisions.map((d, i) => (
                        <li key={i} className="flex gap-2">
                          <Badge variant="success" className="mt-0.5 h-5 shrink-0">
                            {i + 1}
                          </Badge>
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <Button variant="brand" size="lg" className="w-full" asChild>
                <Link href={`/hasil-rapat/${meeting.id}` as never}>
                  <FileText className="size-4" />
                  Lihat Hasil Rapat Lengkap
                </Link>
              </Button>
            </motion.div>
          )}

          {recorder.error && <p className="text-sm text-destructive">{recorder.error}</p>}
        </DialogContent>
      </Dialog>

      <ApiKeyRequiredDialog missing={missing} onOpenChange={(v) => !v && dismissMissing()} />
    </>
  );
}
