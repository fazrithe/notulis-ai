import type { AdminUser, ApiKeyConfig, Meeting } from "@/lib/types";

// ---------------------------------------------------------------------------
// DATA DUMMY — siap pakai untuk development/demo.
//
// File ini adalah SATU-SATUNYA sumber data awal aplikasi. Untuk pindah ke
// database sungguhan (MySQL/PostgreSQL via Prisma), lihat panduan lengkap di
// MIGRATION.md — intinya cukup ganti isi fungsi di src/lib/db/store.ts agar
// membaca/menulis lewat `prisma.*` alih-alih file JSON, bentuk data (types.ts)
// TIDAK perlu berubah karena sudah dirancang 1:1 dengan prisma/schema.prisma.
// ---------------------------------------------------------------------------

export const SEED_ADMIN_USERS: AdminUser[] = [
  {
    id: "usr-1",
    name: "Admin Notulis",
    email: "admin@notulis.com",
    password: "Notul!s&888",
    role: "superadmin",
    avatarUrl: null,
    isActive: true,
    createdAt: "2026-01-10T02:00:00.000Z",
  },
  {
    id: "usr-2",
    name: "Sri Wulandari",
    email: "sri.wulandari@notulis.com",
    password: "Sekre!Rapat21",
    role: "admin",
    avatarUrl: null,
    isActive: true,
    createdAt: "2026-02-14T03:30:00.000Z",
  },
  {
    id: "usr-3",
    name: "Bagas Prasetyo",
    email: "bagas.prasetyo@notulis.com",
    password: "Notula#Bagas9",
    role: "admin",
    avatarUrl: null,
    isActive: false,
    createdAt: "2026-03-02T01:15:00.000Z",
  },
];

export const SEED_API_KEYS: ApiKeyConfig[] = [
  {
    provider: "assemblyai",
    label: "AssemblyAI",
    apiKey: "",
    isConfigured: false,
    lastTestedAt: null,
    lastTestStatus: "belum_diuji",
    updatedAt: "2026-01-10T02:00:00.000Z",
  },
  {
    provider: "gemini",
    label: "Google Gemini",
    apiKey: "",
    isConfigured: false,
    lastTestedAt: null,
    lastTestStatus: "belum_diuji",
    updatedAt: "2026-01-10T02:00:00.000Z",
  },
];

function seg(id: string, speakerId: string, text: string, startSec: number, endSec: number) {
  return { id, speakerId, text, startSec, endSec };
}

export const SEED_MEETINGS: Meeting[] = [
  {
    id: "mtg-1",
    title: "Rapat Koordinasi Mingguan Tim Marketing",
    date: "2026-08-17",
    startTime: "2026-08-17T02:00:00.000Z",
    endTime: "2026-08-17T02:41:12.000Z",
    durationSec: 2472,
    status: "selesai",
    location: "Ruang Rapat Lantai 3",
    speakers: [
      { id: "spk-1a", rawLabel: "Speaker A", displayName: "Bapak Andi (Manajer Marketing)", gender: "male", genderConfidence: 0.91, talkTimeSec: 1290, colorIndex: 0 },
      { id: "spk-1b", rawLabel: "Speaker B", displayName: "Ibu", gender: "female", genderConfidence: 0.86, talkTimeSec: 780, colorIndex: 1 },
      { id: "spk-1c", rawLabel: "Speaker C", displayName: "Bapak", gender: "male", genderConfidence: 0.78, talkTimeSec: 402, colorIndex: 2 },
    ],
    transcript: [
      seg("t1-1", "spk-1a", "Selamat pagi semuanya, terima kasih sudah hadir. Hari ini kita bahas progres campaign kuartal tiga dan rencana anggaran bulan depan.", 0, 12),
      seg("t1-2", "spk-1b", "Pagi Pak. Untuk campaign Instagram, reach kita naik 24 persen dibanding bulan lalu, tapi conversion rate masih di bawah target.", 13, 27),
      seg("t1-3", "spk-1a", "Menurut Ibu apa penyebab conversion masih rendah?", 28, 33),
      seg("t1-4", "spk-1b", "Kemungkinan landing page-nya kurang optimal di mobile, saya sudah minta tim desain untuk revisi minggu ini.", 34, 45),
      seg("t1-5", "spk-1c", "Saya tambahkan, dari sisi budget iklan kita masih ada sisa 18 juta yang belum terpakai sampai akhir bulan.", 46, 58),
      seg("t1-6", "spk-1a", "Baik, sisa budget itu kita alokasikan untuk boosting konten yang performanya paling bagus saja.", 59, 68),
      seg("t1-7", "spk-1b", "Siap Pak, saya buatkan laporan performanya paling lambat Jumat.", 69, 76),
      seg("t1-8", "spk-1a", "Oke, lanjut ke agenda kedua soal rencana campaign Ramadan tahun depan, kita mulai riset dari sekarang supaya tidak terburu-buru.", 77, 90),
    ],
    summary: {
      overview:
        "Rapat membahas evaluasi performa campaign marketing kuartal tiga, kendala conversion rate, alokasi sisa anggaran iklan, serta persiapan awal campaign Ramadan tahun depan.",
      keyPoints: [
        "Reach campaign Instagram naik 24% dibanding bulan lalu.",
        "Conversion rate masih di bawah target, diduga karena landing page kurang optimal di mobile.",
        "Sisa anggaran iklan bulan ini sebesar Rp18 juta belum terpakai.",
      ],
      decisions: [
        "Sisa anggaran iklan dialokasikan untuk boosting konten dengan performa terbaik.",
        "Revisi landing page mobile dikerjakan minggu ini oleh tim desain.",
        "Riset campaign Ramadan dimulai dari sekarang.",
      ],
      actionItems: [
        { id: "ai-1-1", task: "Revisi landing page versi mobile", owner: "Ibu (Tim Desain)", due: "2026-08-21", done: false },
        { id: "ai-1-2", task: "Laporan performa konten untuk boosting", owner: "Ibu", due: "2026-08-21", done: false },
        { id: "ai-1-3", task: "Mulai riset tren campaign Ramadan", owner: "Bapak Andi", due: "2026-09-01", done: false },
      ],
      generatedAt: "2026-08-17T02:43:00.000Z",
      generatedBy: "gemini",
    },
    createdBy: "usr-1",
    createdAt: "2026-08-17T01:58:00.000Z",
    updatedAt: "2026-08-17T02:43:00.000Z",
  },
  {
    id: "mtg-2",
    title: "Evaluasi Proyek Implementasi Sistem Q3",
    date: "2026-08-17",
    startTime: "2026-08-17T06:30:00.000Z",
    endTime: "2026-08-17T07:05:40.000Z",
    durationSec: 2140,
    status: "selesai",
    location: "Google Meet",
    speakers: [
      { id: "spk-2a", rawLabel: "Speaker A", displayName: "Ibu Ratna (Project Lead)", gender: "female", genderConfidence: 0.88, talkTimeSec: 1100, colorIndex: 0 },
      { id: "spk-2b", rawLabel: "Speaker B", displayName: "Bapak", gender: "male", genderConfidence: 0.83, talkTimeSec: 640, colorIndex: 1 },
    ],
    transcript: [
      seg("t2-1", "spk-2a", "Kita mulai ya. Progress sprint minggu ini sudah 80 persen, sisanya modul laporan yang masih proses testing.", 0, 14),
      seg("t2-2", "spk-2b", "Untuk testing modul laporan, ada 3 bug minor yang sudah kami temukan, targetnya selesai besok sore.", 15, 27),
      seg("t2-3", "spk-2a", "Baik, kalau begitu kita masih on track untuk deadline akhir bulan.", 28, 35),
      seg("t2-4", "spk-2b", "Betul Bu, tapi saya usul UAT dengan klien digeser dua hari supaya lebih aman.", 36, 46),
      seg("t2-5", "spk-2a", "Setuju, saya koordinasikan dengan pihak klien untuk jadwal barunya.", 47, 55),
    ],
    summary: {
      overview:
        "Progres proyek implementasi sistem sudah mencapai 80%, tersisa modul laporan yang sedang tahap testing dengan tiga bug minor. Jadwal UAT diusulkan mundur dua hari untuk keamanan timeline.",
      keyPoints: [
        "Progress sprint minggu ini mencapai 80%.",
        "Modul laporan masih dalam tahap testing, ditemukan 3 bug minor.",
        "UAT dengan klien diusulkan mundur 2 hari.",
      ],
      decisions: ["Jadwal UAT klien digeser 2 hari dari rencana semula."],
      actionItems: [
        { id: "ai-2-1", task: "Selesaikan perbaikan 3 bug modul laporan", owner: "Bapak", due: "2026-08-18", done: true },
        { id: "ai-2-2", task: "Koordinasi ulang jadwal UAT dengan klien", owner: "Ibu Ratna", due: "2026-08-19", done: false },
      ],
      generatedAt: "2026-08-17T07:07:00.000Z",
      generatedBy: "gemini",
    },
    createdBy: "usr-2",
    createdAt: "2026-08-17T06:25:00.000Z",
    updatedAt: "2026-08-17T07:07:00.000Z",
  },
  {
    id: "mtg-3",
    title: "Rapat Anggaran Tahunan Divisi Operasional",
    date: "2026-08-12",
    startTime: "2026-08-12T03:00:00.000Z",
    endTime: "2026-08-12T04:12:00.000Z",
    durationSec: 4320,
    status: "selesai",
    location: "Ruang Rapat Utama",
    speakers: [
      { id: "spk-3a", rawLabel: "Speaker A", displayName: "Bapak Herman (Direktur Operasional)", gender: "male", genderConfidence: 0.93, talkTimeSec: 2600, colorIndex: 0 },
      { id: "spk-3b", rawLabel: "Speaker B", displayName: "Ibu", gender: "female", genderConfidence: 0.8, talkTimeSec: 1300, colorIndex: 1 },
    ],
    transcript: [
      seg("t3-1", "spk-3a", "Anggaran operasional tahun depan kita usulkan naik 12 persen, terutama untuk pemeliharaan alat.", 0, 15),
      seg("t3-2", "spk-3b", "Apakah kenaikan itu sudah termasuk rencana penambahan dua unit kendaraan operasional?", 16, 26),
      seg("t3-3", "spk-3a", "Sudah termasuk, tapi masih perlu persetujuan direksi minggu depan.", 27, 35),
    ],
    summary: {
      overview: "Diusulkan kenaikan anggaran operasional 12% untuk tahun depan, termasuk penambahan dua unit kendaraan, menunggu persetujuan direksi.",
      keyPoints: ["Usulan kenaikan anggaran operasional 12%.", "Termasuk rencana penambahan 2 unit kendaraan operasional."],
      decisions: ["Proposal anggaran diajukan ke direksi minggu depan untuk persetujuan."],
      actionItems: [{ id: "ai-3-1", task: "Siapkan proposal anggaran final untuk direksi", owner: "Bapak Herman", due: "2026-08-18", done: false }],
      generatedAt: "2026-08-12T04:15:00.000Z",
      generatedBy: "gemini",
    },
    createdBy: "usr-1",
    createdAt: "2026-08-12T02:55:00.000Z",
    updatedAt: "2026-08-12T04:15:00.000Z",
  },
  {
    id: "mtg-4",
    title: "Sinkronisasi Tim Produk & Engineering",
    date: "2026-08-05",
    startTime: "2026-08-05T01:30:00.000Z",
    endTime: "2026-08-05T02:02:00.000Z",
    durationSec: 1920,
    status: "selesai",
    location: "Zoom",
    speakers: [
      { id: "spk-4a", rawLabel: "Speaker A", displayName: "Bapak", gender: "male", genderConfidence: 0.7, talkTimeSec: 980, colorIndex: 0 },
      { id: "spk-4b", rawLabel: "Speaker B", displayName: "Ibu Sinta (Product Manager)", gender: "female", genderConfidence: 0.89, talkTimeSec: 940, colorIndex: 1 },
    ],
    transcript: [
      seg("t4-1", "spk-4b", "Fitur notulen otomatis sudah masuk tahap QA, target rilis minggu depan.", 0, 10),
      seg("t4-2", "spk-4a", "Ada satu isu di deteksi pembicara saat suara bertumpuk, sedang kami perbaiki.", 11, 20),
    ],
    summary: {
      overview: "Fitur notulen otomatis memasuki tahap QA dengan target rilis minggu depan. Ditemukan isu deteksi pembicara saat suara bertumpuk yang sedang diperbaiki.",
      keyPoints: ["Fitur notulen otomatis masuk tahap QA.", "Isu deteksi pembicara saat suara bertumpuk sedang diperbaiki."],
      decisions: ["Target rilis fitur tetap minggu depan dengan catatan isu overlap voice diperbaiki dulu."],
      actionItems: [{ id: "ai-4-1", task: "Perbaiki isu deteksi pembicara saat suara bertumpuk", owner: "Bapak", due: "2026-08-10", done: true }],
      generatedAt: "2026-08-05T02:05:00.000Z",
      generatedBy: "gemini",
    },
    createdBy: "usr-2",
    createdAt: "2026-08-05T01:25:00.000Z",
    updatedAt: "2026-08-05T02:05:00.000Z",
  },
  {
    id: "mtg-5",
    title: "Rapat Persiapan Audit Internal",
    date: "2026-08-20",
    startTime: null,
    endTime: null,
    durationSec: 0,
    status: "terjadwal",
    location: "Ruang Rapat Lantai 2",
    speakers: [],
    transcript: [],
    summary: null,
    createdBy: "usr-1",
    createdAt: "2026-08-16T05:00:00.000Z",
    updatedAt: "2026-08-16T05:00:00.000Z",
  },
  {
    id: "mtg-6",
    title: "Rapat Review Kontrak Vendor",
    date: "2026-08-21",
    startTime: null,
    endTime: null,
    durationSec: 0,
    status: "terjadwal",
    location: "Ruang Rapat Lantai 3",
    speakers: [],
    transcript: [],
    summary: null,
    createdBy: "usr-2",
    createdAt: "2026-08-16T06:00:00.000Z",
    updatedAt: "2026-08-16T06:00:00.000Z",
  },
];
