import {
  AudioLines,
  BookOpenText,
  CalendarPlus,
  Download,
  KeyRound,
  Mic,
  ShieldQuestion,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROVIDER_LABEL } from "@/lib/ai/roles";

const AI_ROLES = [
  {
    icon: AudioLines,
    provider: PROVIDER_LABEL.assemblyai,
    body: "Mengubah rekaman jadi teks dan memisahkan siapa berbicara kapan (speaker diarization), lengkap dengan penanda waktu tiap segmen.",
  },
  {
    icon: Sparkles,
    provider: PROVIDER_LABEL.gemini,
    body: "Membaca transkrip hasil AssemblyAI, lalu menyusun ringkasan, poin penting, keputusan rapat, dan daftar tindak lanjut.",
  },
];

const STEPS = [
  {
    icon: KeyRound,
    title: "1. Atur Kedua API Key",
    body: "Buka menu API Key, lalu masukkan API key AssemblyAI DAN Google Gemini. Keduanya wajib — AssemblyAI menangani transkripsi, Gemini menangani kesimpulan. Selama salah satu masih kosong, rekaman tidak bisa dimulai dan aplikasi akan mengarahkan Anda kembali ke menu ini.",
  },
  {
    icon: CalendarPlus,
    title: "2. Buat Notulis Baru",
    body: 'Buka menu Agenda Rapat, pilih tanggal di kalender, lalu klik tombol "Buat Notulis". Isi judul rapat dan lokasi (opsional) — provider tidak perlu dipilih karena perannya sudah tetap.',
  },
  {
    icon: Mic,
    title: "3. Mulai Merekam",
    body: 'Klik "Mulai Rekam" — aplikasi otomatis mencatat tanggal dan jam mulai, lalu mulai merekam suara dari mikrofon Anda. Pratinjau transkrip muncul setiap kali percakapan berhenti sejenak.',
  },
  {
    icon: Users,
    title: "4. Selesai & Deteksi Pembicara",
    body: 'Klik "Selesai Rekam" untuk berhenti. Rekaman dikirim ke AssemblyAI untuk transkripsi sekaligus pemisahan pembicara, lalu diberi label sementara "Bapak"/"Ibu" berdasarkan nada suara — Anda bisa mengganti nama ini secara manual.',
  },
  {
    icon: Sparkles,
    title: "5. Buat Kesimpulan Rapat",
    body: 'Setelah transkrip siap, klik "Buat Kesimpulan Rapat". Transkrip AssemblyAI tadi dikirim ke Google Gemini untuk menghasilkan ringkasan, poin penting, keputusan, dan daftar tindak lanjut.',
  },
  {
    icon: Download,
    title: "6. Lihat & Unduh Hasil",
    body: "Buka menu Hasil Rapat untuk melihat seluruh notulen yang sudah selesai, dan unduh sebagai file PDF kapan saja.",
  },
];

const FAQS = [
  {
    q: "Kenapa label pembicara kadang salah (Bapak/Ibu tertukar)?",
    a: "Deteksi gender dari suara memakai analisis nada dasar (pitch) di browser, bukan model AI penuh — hasilnya adalah tebakan awal, bukan identifikasi pasti. Anda selalu bisa mengganti nama pembicara secara manual saat meninjau transkrip.",
  },
  {
    q: "Apakah reCAPTCHA di halaman login sudah aktif?",
    a: "Secara default aplikasi ini memakai kunci uji resmi dari Google yang selalu meloloskan verifikasi, supaya demo bisa langsung dicoba. Untuk produksi, ganti NEXT_PUBLIC_RECAPTCHA_SITE_KEY dan RECAPTCHA_SECRET_KEY di file .env dengan kunci asli dari google.com/recaptcha/admin.",
  },
  {
    q: "Kenapa harus mengisi dua API key sekaligus?",
    a: "Karena keduanya dipakai bersama pada satu rapat, bukan sebagai alternatif. AssemblyAI dipilih untuk transkripsi karena lebih akurat memisahkan pembicara (speaker diarization) lengkap dengan penanda waktu, sedangkan Gemini dipakai untuk menyusun ringkasan, keputusan, dan tindak lanjut dari transkrip tersebut. Kalau salah satu belum diisi, tombol rekam akan memunculkan peringatan dan mengarahkan Anda ke menu API Key.",
  },
  {
    q: "Kapan pratinjau transkrip muncul saat rekaman berjalan?",
    a: "Setiap kali percakapan berhenti sejenak (jeda sekitar satu detik), potongan audio yang sudah terkumpul dikirim untuk ditranskrip sehingga teksnya langsung terlihat. Bila peserta bicara terus tanpa jeda, pratinjau tetap diperbarui paling lambat setiap 25 detik.",
  },
  {
    q: "Apakah data rapat tersimpan permanen?",
    a: "Versi ini memakai data dummy berbasis file JSON di server sebagai contoh — cocok untuk demo/pengembangan. Untuk penggunaan produksi, hubungkan ke database MySQL/PostgreSQL sungguhan mengikuti panduan di MIGRATION.md pada source code proyek.",
  },
];

export default function PanduanPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpenText className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Cara Pemakaian Notulis AI</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Panduan singkat merekam rapat, membuat notulen, hingga mengunduh hasilnya.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="size-4.5 text-primary" />
            Pembagian Peran AI
          </CardTitle>
          <CardDescription>Kedua layanan dipakai bersama dalam satu alur, bukan sebagai pilihan alternatif</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AI_ROLES.map((role) => (
              <div key={role.provider} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <role.icon className="size-4" />
                  </span>
                  <p className="font-medium">{role.provider}</p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{role.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Alur: rekam → AssemblyAI (transkrip + pemisahan pembicara) → tinjau &amp; ganti nama pembicara → Gemini
            (ringkasan, keputusan, tindak lanjut) → unduh PDF.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title} className="h-full">
            <CardHeader>
              <span className="mb-1 flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white">
                <step.icon className="size-4.5" />
              </span>
              <CardTitle className="text-base">{step.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AudioLines className="size-4.5 text-primary" />
            Tips Kualitas Rekaman
          </CardTitle>
          <CardDescription>Agar transkrip dan deteksi pembicara lebih akurat</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2">
            {[
              "Gunakan mikrofon yang dekat dengan peserta rapat, hindari ruangan bergema.",
              "Minta peserta bicara bergantian, hindari suara bertumpuk (overlap).",
              "Untuk rapat besar, gunakan mikrofon omnidirectional atau speakerphone berkualitas.",
              "Pastikan koneksi internet stabil saat proses transkripsi & ringkasan berjalan.",
            ].map((tip) => (
              <li key={tip} className="flex gap-2 rounded-lg bg-muted/40 p-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldQuestion className="size-4.5 text-primary" />
            Pertanyaan Umum
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <p className="flex items-start gap-2 text-sm font-medium">
                <Badge variant="outline" className="mt-0.5 h-5 shrink-0">
                  Q
                </Badge>
                {faq.q}
              </p>
              <p className="mt-2 pl-7 text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
