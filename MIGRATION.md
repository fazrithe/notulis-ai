# Migrasi dari Data Dummy (JSON) ke PostgreSQL/MySQL

Aplikasi ini secara default menyimpan data di file `data/db.json` lewat lapisan repository di `src/lib/db/store.ts`. Panduan ini menjelaskan cara memindahkannya ke database sungguhan (PostgreSQL atau MySQL) memakai [Prisma](https://www.prisma.io/), yang skemanya **sudah disiapkan** di `prisma/schema.prisma`.

Prinsip utamanya: **hanya `src/lib/db/store.ts` yang perlu diganti isinya.** Semua halaman dan API route lain memanggil fungsi-fungsi dari file ini (`listMeetings`, `createMeeting`, `getUserByEmail`, dst.) — signature setiap fungsi sudah didesain sama persis dengan apa yang akan dikembalikan Prisma, jadi kode pemanggil tidak perlu disentuh.

## 1. Siapkan database & install Prisma

```bash
npm install prisma @prisma/client
npx prisma generate
```

Buat database kosong di PostgreSQL atau MySQL, lalu isi `DATABASE_URL` di `.env.local`, misalnya:

```bash
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/notulis_ai"

# atau MySQL
DATABASE_URL="mysql://user:password@localhost:3306/notulis_ai"
```

## 2. Pilih provider database di skema

Buka `prisma/schema.prisma`, pada blok `datasource db` ganti `provider` sesuai database Anda:

```prisma
datasource db {
  provider = "postgresql" // ganti ke "mysql" jika perlu
  url      = env("DATABASE_URL")
}
```

Skema ini sudah mencakup seluruh entitas aplikasi: `AdminUser`, `Meeting`, `Speaker`, `TranscriptSegment`, `MeetingSummary`, `ApiKeyConfig`, beserta enum `AdminRole`, `SpeakerGender`, `MeetingStatus`, `AiProvider`.

## 3. Jalankan migrasi

```bash
npx prisma migrate dev --name init
```

Ini akan membuat semua tabel di database Anda sesuai skema.

## 4. Pindahkan data dummy (opsional)

Jika ingin mengisi database dengan data contoh yang sama seperti versi JSON, buat skrip seed Prisma (`prisma/seed.ts`) yang membaca `src/lib/db/seed.ts` (`SEED_ADMIN_USERS`, `SEED_MEETINGS`, `SEED_API_KEYS`) dan menulisnya lewat Prisma Client — perhatikan bahwa `Meeting` di seed.ts menyimpan `speakers`, `transcript`, dan `summary` sebagai objek bersarang, sedangkan di skema Prisma ketiganya adalah relasi terpisah (`Speaker[]`, `TranscriptSegment[]`, `MeetingSummary?`), jadi perlu di-"flatten" saat insert (lihat contoh `createMeetingFull` di langkah 5).

## 5. Ganti isi `src/lib/db/store.ts`

Ganti implementasi berbasis file JSON dengan pemanggilan Prisma Client. Struktur fungsi (nama & signature) **tetap sama** agar tidak perlu mengubah kode di luar file ini. Contoh:

```ts
import { PrismaClient } from "@prisma/client";
import type { AdminUser, ApiKeyConfig, Meeting } from "@/lib/types";

const prisma = new PrismaClient();

// --- Meetings ---------------------------------------------------------------

export async function listMeetings(): Promise<Meeting[]> {
  const rows = await prisma.meeting.findMany({
    include: { speakers: true, transcript: true, summary: true },
    orderBy: { date: "desc" },
  });
  return rows.map(toMeetingDTO);
}

export async function listMeetingsByDate(date: string): Promise<Meeting[]> {
  const rows = await prisma.meeting.findMany({
    where: { date: new Date(date) },
    include: { speakers: true, transcript: true, summary: true },
  });
  return rows.map(toMeetingDTO);
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  const row = await prisma.meeting.findUnique({
    where: { id },
    include: { speakers: true, transcript: true, summary: true },
  });
  return row ? toMeetingDTO(row) : null;
}

export async function createMeeting(input: {
  title: string;
  date: string;
  location?: string;
  createdBy: string;
}): Promise<Meeting> {
  const row = await prisma.meeting.create({
    data: {
      title: input.title,
      date: new Date(input.date),
      location: input.location,
      createdById: input.createdBy,
      status: "terjadwal",
    },
    include: { speakers: true, transcript: true, summary: true },
  });
  return toMeetingDTO(row);
}

// updateMeeting, deleteMeeting, listUsers, getUserByEmail, dst mengikuti pola yang sama —
// lihat versi asli di file ini untuk daftar lengkap fungsi yang perlu diganti.

// Helper untuk mengubah bentuk relasional Prisma kembali ke bentuk Meeting
// bersarang yang dipakai UI (sesuai src/lib/types.ts).
function toMeetingDTO(row: /* hasil query Prisma di atas */ any): Meeting {
  return {
    id: row.id,
    title: row.title,
    date: row.date.toISOString().slice(0, 10),
    startTime: row.startTime?.toISOString() ?? null,
    endTime: row.endTime?.toISOString() ?? null,
    durationSec: row.durationSec,
    status: row.status,
    location: row.location ?? undefined,
    speakers: row.speakers,
    transcript: row.transcript,
    summary: row.summary
      ? {
          overview: row.summary.overview,
          keyPoints: row.summary.keyPoints,
          decisions: row.summary.decisions,
          actionItems: row.summary.actionItems,
          generatedAt: row.summary.generatedAt.toISOString(),
          generatedBy: row.summary.generatedBy,
        }
      : null,
    createdBy: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
```

Fungsi lain (`updateUser`, `deleteUser`, `listApiKeys`, `getActiveApiKey`, `upsertApiKey`, dll.) mengikuti pola yang sama: query Prisma menggantikan baca/tulis `data/db.json`.

> **Catatan penting:** karena semua fungsi di `store.ts` saat ini bersifat sinkron (membaca file langsung), sedangkan Prisma Client bersifat **async**, setiap fungsi di atas perlu ditambah `async`/`await` dan setiap tempat yang memanggilnya (API routes, Server Components) juga perlu di-`await`. Sebagian besar pemanggil di aplikasi ini sudah berupa `async function` (Server Components & route handlers), jadi perubahan yang dibutuhkan biasanya hanya menambahkan `await` di depan pemanggilan fungsi store.

## 6. Keamanan tambahan sebelum produksi

- **Hash password**: kolom `password` pada `AdminUser` saat ini plain text (untuk kesederhanaan demo). Sebelum produksi, hash dengan bcrypt/argon2 saat membuat/mengubah user, dan verifikasi hash saat login (`src/app/api/auth/login/route.ts`).
- **Enkripsi API key**: kolom `apiKey` pada `ApiKeyConfig` idealnya dienkripsi (mis. via KMS atau libsodium) sebelum disimpan, lalu didekripsi saat dipakai memanggil AssemblyAI/Gemini.
- Kedua catatan ini juga tertulis sebagai komentar `///` langsung di `prisma/schema.prisma`.

## 7. Hapus data dummy JSON (opsional)

Setelah database sungguhan berjalan, Anda bisa menghapus `data/db.json` dan (opsional) `src/lib/db/seed.ts` bila tidak lagi diperlukan sebagai referensi seed.
