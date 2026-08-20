"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ListChecks,
  MapPin,
  MessageSquareText,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { formatDateID, formatDuration, formatTimeID } from "@/lib/utils";
import { PROVIDER_LABEL } from "@/lib/ai/roles";
import { speakerColor } from "@/lib/speaker-colors";
import { generateMeetingPdf } from "@/lib/pdf/meeting-pdf";
import type { Meeting } from "@/lib/types";

export function MeetingDetail({ meeting }: { meeting: Meeting }) {
  const speakerById = new Map(meeting.speakers.map((s) => [s.id, s]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2.5 mb-2 text-muted-foreground" asChild>
            <Link href={"/hasil-rapat" as never}>
              <ArrowLeft className="size-4" />
              Kembali ke Hasil Rapat
            </Link>
          </Button>
          <h2 className="text-xl font-bold tracking-tight">{meeting.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {formatDateID(meeting.date)}
            </span>
            {meeting.startTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4" />
                {formatTimeID(meeting.startTime)} · {formatDuration(meeting.durationSec)}
              </span>
            )}
            {meeting.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
                {meeting.location}
              </span>
            )}
            <MeetingStatusBadge status={meeting.status} />
          </div>
        </div>
        <Button variant="brand" disabled={!meeting.summary} onClick={() => generateMeetingPdf(meeting)}>
          <Download className="size-4" />
          Unduh PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {meeting.summary ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="size-4.5 text-primary" />
                    Ringkasan Rapat
                  </CardTitle>
                  <CardDescription>
                    Dibuat otomatis oleh {PROVIDER_LABEL[meeting.summary.generatedBy]} dari transkrip{" "}
                    {PROVIDER_LABEL.assemblyai}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="text-sm leading-relaxed text-foreground/90">{meeting.summary.overview}</p>

                  {meeting.summary.keyPoints.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        <MessageSquareText className="size-3.5" />
                        Poin Penting
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        {meeting.summary.keyPoints.map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {meeting.summary.decisions.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        <CheckCircle2 className="size-3.5" />
                        Keputusan
                      </p>
                      <ul className="space-y-1.5 text-sm">
                        {meeting.summary.decisions.map((d, i) => (
                          <li key={i} className="flex gap-2 rounded-lg bg-success/10 px-3 py-2 text-success-foreground">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                            <span className="text-foreground/90">{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {meeting.summary.actionItems.length > 0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        <ListChecks className="size-3.5" />
                        Tindak Lanjut
                      </p>
                      <div className="space-y-2">
                        {meeting.summary.actionItems.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm"
                          >
                            <div>
                              <p className="font-medium">{a.task}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                PIC: {a.owner}
                                {a.due ? ` · Tenggat ${formatDateID(a.due)}` : ""}
                              </p>
                            </div>
                            <Badge variant={a.done ? "success" : "secondary"}>{a.done ? "Selesai" : "Berjalan"}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Rapat ini belum memiliki kesimpulan. Buka Agenda Rapat untuk melanjutkan proses rekaman.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Transkrip Percakapan Lengkap</CardTitle>
              <CardDescription>{meeting.transcript.length} segmen percakapan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1 scrollbar-thin">
                {meeting.transcript.map((seg) => {
                  const speaker = speakerById.get(seg.speakerId);
                  const color = speakerColor(speaker?.colorIndex ?? 0);
                  return (
                    <div key={seg.id} className="flex gap-3">
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className={`${color.bg} ${color.text} bg-none`}>
                          {speaker?.displayName?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">
                          <span className={`font-medium ${color.text}`}>{speaker?.displayName ?? "Peserta"}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {Math.floor(seg.startSec / 60)}:{String(Math.floor(seg.startSec % 60)).padStart(2, "0")}
                          </span>
                        </p>
                        <p className="mt-0.5 text-sm text-foreground/90">{seg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4.5 text-primary" />
                Pembicara
              </CardTitle>
              <CardDescription>Label otomatis, bisa diedit saat sesi rekaman</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {meeting.speakers.map((sp) => {
                const color = speakerColor(sp.colorIndex);
                return (
                  <div key={sp.id} className="flex items-center gap-3 rounded-xl border border-border p-2.5">
                    <Avatar className="size-9">
                      <AvatarFallback className={`${color.bg} ${color.text} bg-none`}>
                        {sp.displayName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{sp.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(sp.talkTimeSec)} bicara
                        {sp.genderConfidence ? ` · keyakinan ${Math.round(sp.genderConfidence * 100)}%` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              {meeting.speakers.length === 0 && (
                <p className="text-sm text-muted-foreground">Belum ada data pembicara.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Info Transkripsi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Transkripsi</span>
                <Badge variant="outline">{PROVIDER_LABEL.assemblyai}</Badge>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Ringkasan</span>
                <Badge variant="outline">{PROVIDER_LABEL.gemini}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Durasi</span>
                <span className="font-medium">{formatDuration(meeting.durationSec)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dibuat</span>
                <span className="font-medium">{formatDateID(meeting.createdAt, true)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
