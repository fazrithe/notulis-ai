"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  KeyRound,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { CreateMeetingDialog } from "@/components/agenda/create-meeting-dialog";
import { EditMeetingDialog } from "@/components/agenda/edit-meeting-dialog";
import { RecordingDialog } from "@/components/agenda/recording-dialog";
import { ApiKeyRequiredDialog } from "@/components/api-key/api-key-required-dialog";
import { useApiKeyGuard } from "@/hooks/use-api-key-guard";
import { PROVIDER_LABEL } from "@/lib/ai/roles";
import { formatDateID, formatTimeID } from "@/lib/utils";
import type { AiProvider, Meeting } from "@/lib/types";

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function meetingSnippet(meeting: Meeting) {
  if (meeting.summary?.overview) return meeting.summary.overview;
  if (meeting.transcript.length) return meeting.transcript.map((t) => t.text).join(" ");
  return "Rapat ini belum direkam.";
}

export function AgendaBoard({
  meetings,
  missingApiKeys,
}: {
  meetings: Meeting[];
  /** Provider yang API key-nya belum diisi — dipakai untuk banner peringatan. */
  missingApiKeys: AiProvider[];
}) {
  const router = useRouter();
  const { missing, checking, ensureApiKeysReady, dismissMissing } = useApiKeyGuard();
  const today = React.useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = React.useState<Date>(today);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editMeeting, setEditMeeting] = React.useState<Meeting | null>(null);
  const [deleteMeeting, setDeleteMeetingState] = React.useState<Meeting | null>(null);
  const [recordingMeeting, setRecordingMeeting] = React.useState<Meeting | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const meetingDates = React.useMemo(() => {
    const set = new Set<string>();
    meetings.forEach((m) => set.add(m.date));
    return set;
  }, [meetings]);

  const selectedKey = toDateKey(selectedDate);
  const meetingsForDate = meetings
    .filter((m) => m.date === selectedKey)
    .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));

  // Rekaman hanya boleh dibuka kalau kedua API key sudah siap; kalau belum,
  // useApiKeyGuard memunculkan peringatan + pintasan ke menu API Key.
  async function openRecording(meeting: Meeting) {
    if (await ensureApiKeysReady()) setRecordingMeeting(meeting);
  }

  async function openCreate() {
    if (await ensureApiKeysReady()) setCreateOpen(true);
  }

  function handleCreated(meeting: Meeting) {
    toast.success("Notulis baru dibuat");
    setRecordingMeeting(meeting);
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleteMeeting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/meetings/${deleteMeeting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("Gagal menghapus rapat.");
      toast.success("Rapat berhasil dihapus");
      setDeleteMeetingState(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus rapat.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Agenda Rapat</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih tanggal untuk melihat notulen, atau buat rekaman rapat baru.
          </p>
        </div>
        <Button variant="brand" size="lg" disabled={checking} onClick={openCreate}>
          <Plus className="size-4" />
          Buat Notulis
        </Button>
      </div>

      {missingApiKeys.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <KeyRound className="size-4.5" />
            </span>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                API key {missingApiKeys.map((p) => PROVIDER_LABEL[p]).join(" & ")} belum diisi.
              </span>{" "}
              Notulis AI membutuhkan AssemblyAI untuk transkripsi &amp; pemisahan pembicara dan Gemini untuk kesimpulan
              rapat, jadi rekaman belum bisa dimulai.
            </p>
          </div>
          <Button variant="outline" className="shrink-0" onClick={() => router.push("/api-key")}>
            Atur API Key
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[auto_1fr]">
        <Card className="w-fit">
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              modifiers={{ hasMeeting: (d) => meetingDates.has(toDateKey(d)) }}
              modifiersClassNames={{
                hasMeeting: "after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4.5 text-primary" />
              {formatDateID(selectedDate)}
            </CardTitle>
            <CardDescription>
              {meetingsForDate.length
                ? `${meetingsForDate.length} rapat tercatat pada tanggal ini`
                : "Belum ada rapat pada tanggal ini"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {meetingsForDate.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
                <CalendarDays className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Tidak ada agenda. Buat notulis baru untuk tanggal ini.</p>
                <Button size="sm" variant="outline" disabled={checking} onClick={openCreate}>
                  <Plus className="size-4" />
                  Buat Notulis
                </Button>
              </div>
            )}

            {meetingsForDate.map((meeting, i) => (
              <motion.div
                key={meeting.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group flex items-start gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-primary/30 hover:bg-accent/40"
              >
                <div
                  role="button"
                  tabIndex={0}
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() =>
                    meeting.status === "selesai"
                      ? router.push(`/hasil-rapat/${meeting.id}`)
                      : openRecording(meeting)
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{meeting.title}</p>
                    <MeetingStatusBadge status={meeting.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-3.5" />
                      {meeting.startTime ? formatTimeID(meeting.startTime) : "Belum direkam"}
                    </span>
                    {meeting.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {meeting.location}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{meetingSnippet(meeting)}</p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {meeting.status === "selesai" && (
                      <DropdownMenuItem asChild>
                        <Link href={`/hasil-rapat/${meeting.id}` as never}>Lihat Hasil</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setEditMeeting(meeting)}>
                      <Pencil className="size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteMeetingState(meeting)}>
                      <Trash2 className="size-4" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      <CreateMeetingDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDate={selectedKey}
        onCreated={handleCreated}
      />

      <ApiKeyRequiredDialog missing={missing} onOpenChange={(v) => !v && dismissMissing()} />

      <EditMeetingDialog
        meeting={editMeeting}
        open={Boolean(editMeeting)}
        onOpenChange={(v) => !v && setEditMeeting(null)}
        onSaved={() => router.refresh()}
      />

      {recordingMeeting && (
        <RecordingDialog
          meeting={recordingMeeting}
          open={Boolean(recordingMeeting)}
          onOpenChange={(v) => !v && setRecordingMeeting(null)}
          onCompleted={() => router.refresh()}
        />
      )}

      <AlertDialog open={Boolean(deleteMeeting)} onOpenChange={(v) => !v && setDeleteMeetingState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus rapat ini?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteMeeting?.title}&rdquo; beserta transkrip dan ringkasannya akan dihapus permanen. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
