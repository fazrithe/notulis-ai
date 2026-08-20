import Link from "next/link";
import { AudioLines, CalendarCheck2, Clock3, FileText, Mic, Sparkles } from "lucide-react";

import { listMeetings } from "@/lib/db/store";
import { formatDateID, formatDuration, formatTimeID } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { MeetingsBarChart } from "@/components/dashboard/meetings-bar-chart";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function DashboardPage() {
  const meetings = await listMeetings();

  const completed = meetings.filter((m) => m.status === "selesai");
  const scheduled = meetings.filter((m) => m.status === "terjadwal");
  const totalDurationSec = completed.reduce((sum, m) => sum + m.durationSec, 0);
  const avgDurationSec = completed.length ? Math.round(totalDurationSec / completed.length) : 0;

  const byDate = new Map<string, number>();
  for (const m of meetings) {
    byDate.set(m.date, (byDate.get(m.date) ?? 0) + 1);
  }
  const chartData = Array.from(byDate.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, total]) => ({
      date,
      label: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(date)),
      total,
    }));

  const recent = meetings.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Selamat datang kembali 👋</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Berikut ringkasan aktivitas rapat dan notulen Anda.
          </p>
        </div>
        <Button variant="brand" size="lg" asChild>
          <Link href={"/agenda" as never}>
            <Mic className="size-4" />
            Buat Notulis Baru
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Total Rapat"
          value={String(meetings.length)}
          icon={<CalendarCheck2 className="size-5" />}
          delta={`${completed.length} selesai`}
        />
        <StatCard
          index={1}
          label="Total Durasi Rekaman"
          value={formatDuration(totalDurationSec)}
          icon={<Clock3 className="size-5" />}
          delta="Bulan ini"
        />
        <StatCard
          index={2}
          label="Rata-rata Durasi"
          value={formatDuration(avgDurationSec)}
          icon={<AudioLines className="size-5" />}
          delta="Per rapat selesai"
        />
        <StatCard
          index={3}
          label="Rapat Terjadwal"
          value={String(scheduled.length)}
          icon={<FileText className="size-5" />}
          delta="Menunggu direkam"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Aktivitas Rapat</CardTitle>
            <CardDescription>Jumlah rapat tercatat per tanggal</CardDescription>
          </CardHeader>
          <CardContent>
            <MeetingsBarChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Tips Cepat
            </CardTitle>
            <CardDescription>Maksimalkan Notulis AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Atur API key AssemblyAI atau Gemini terlebih dahulu di halaman{" "}
              <Link href={"/api-key" as never} className="font-medium text-primary hover:underline">
                API Key
              </Link>{" "}
              agar transkripsi & ringkasan otomatis dapat berjalan.
            </p>
            <p>
              Label pembicara &ldquo;Bapak&rdquo;/&ldquo;Ibu&rdquo; adalah tebakan otomatis dari suara — Anda tetap bisa
              menggantinya dengan nama asli peserta di halaman hasil rapat.
            </p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href={"/panduan" as never}>Baca panduan lengkap</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rapat Terbaru</CardTitle>
          <CardDescription>5 rapat terakhir yang tercatat</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {recent.map((m) => (
            <Link
              key={m.id}
              href={(m.status === "selesai" ? `/hasil-rapat/${m.id}` : "/agenda") as never}
              className="flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-accent/60"
            >
              <Avatar className="size-9 rounded-lg">
                <AvatarFallback className="rounded-lg">{m.title.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDateID(m.date)}
                  {m.startTime ? ` · ${formatTimeID(m.startTime)}` : ""}
                  {m.location ? ` · ${m.location}` : ""}
                </p>
              </div>
              <MeetingStatusBadge status={m.status} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
