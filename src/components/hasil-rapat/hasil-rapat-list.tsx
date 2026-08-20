"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, FileSearch, FileText, Search, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { formatDateID, formatDuration, formatTimeID } from "@/lib/utils";
import { generateMeetingPdf } from "@/lib/pdf/meeting-pdf";
import type { Meeting } from "@/lib/types";

export function HasilRapatList({ meetings }: { meetings: Meeting[] }) {
  const [query, setQuery] = React.useState("");

  const filtered = meetings.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Hasil Rapat</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Notulen dan kesimpulan rapat yang sudah selesai diproses.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cari judul rapat..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileSearch className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {meetings.length === 0 ? "Belum ada hasil rapat yang selesai diproses." : "Tidak ada hasil yang cocok."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((meeting, i) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="size-4.5" />
                    </span>
                    <MeetingStatusBadge status={meeting.status} />
                  </div>

                  <Link href={`/hasil-rapat/${meeting.id}` as never} className="mt-3 block">
                    <p className="line-clamp-2 font-semibold hover:text-primary">{meeting.title}</p>
                  </Link>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateID(meeting.date)}
                    {meeting.startTime ? ` · ${formatTimeID(meeting.startTime)}` : ""}
                  </p>

                  {meeting.summary?.overview && (
                    <p className="mt-2.5 line-clamp-3 flex-1 text-sm text-muted-foreground">
                      {meeting.summary.overview}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="size-3.5" />
                      {meeting.speakers.length} pembicara · {formatDuration(meeting.durationSec)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={!meeting.summary}
                      onClick={() => generateMeetingPdf(meeting)}
                      title="Unduh PDF"
                    >
                      <Download className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
