# Notulis AI

Aplikasi web untuk merekam rapat secara otomatis, mentranskripsi percakapan (dengan pemisahan pembicara/diarization), mendeteksi jenis kelamin pembicara secara heuristik (dilabel "Bapak"/"Ibu", dapat diedit), dan membuat ringkasan rapat otomatis menggunakan AI — dibangun dengan Next.js 16 (App Router).

## Fitur Utama

- **Login** dengan proteksi reCAPTCHA v2 (kredensial contoh: `admin@notulis.com` / `Notul!s&888`)
- **Dashboard** — statistik rapat, grafik aktivitas, daftar rapat terbaru
- **Agenda Rapat** — kalender interaktif, daftar notulen per tanggal, alur rekam-transkripsi-ringkas dalam satu dialog ("Mulai" → rekam otomatis dgn timestamp → "Selesai" → "Buat Kesimpulan Rapat")
- **Hasil Rapat** — daftar & detail notulen, unduh sebagai PDF
- **CRUD Admin** — kelola pengguna admin
- **API Key** — dua provider AI dipakai **bersamaan** dengan peran tetap: **AssemblyAI** untuk transkripsi + pemisahan pembicara, **Google Gemini** untuk ringkasan rapat. Keduanya wajib diisi dari UI (bukan env var) dan tersimpan di data store; selama salah satu kosong, tombol rekam memunculkan peringatan lalu mengarahkan ke halaman API Key
- **Cara Pemakaian** — panduan penggunaan aplikasi

## Tech Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Radix UI (komponen dibangun sendiri gaya shadcn/ui) · Framer Motion · Recharts · jsPDF · MediaRecorder & Web Audio API (rekam + deteksi gender dari pitch suara) · AssemblyAI API (transkripsi & diarization) & Google Gemini API (ringkasan)

## Menjalankan Secara Lokal

```bash
npm install
cp .env.example .env.local   # lalu sesuaikan nilainya, lihat penjelasan di bawah
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Login dengan kredensial contoh di atas.

Dengan `DB_CONNECT="false"` (default) aplikasi langsung jalan memakai **data dummy JSON** tanpa perlu database. Untuk memakai **MySQL**, lihat bagian [Sumber Data](#sumber-data-dummy-json-atau-mysql) di bawah.

## Environment Variables

Lihat `.env.example`. Semua bersifat opsional untuk pengembangan lokal (ada nilai default), tapi **wajib diisi dengan benar sebelum deploy ke produksi**:

| Variabel | Keterangan |
|---|---|
| `SESSION_SECRET` | Kunci rahasia untuk menandatangani cookie sesi (HMAC-SHA256). Wajib diganti di produksi — jangan pakai nilai default dev. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Site key reCAPTCHA v2 ("I'm not a robot" checkbox). Default memakai **test key resmi Google** yang selalu lolos verifikasi — cocok untuk demo, **wajib diganti dengan site key asli dari akun [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin) Anda sebelum produksi**. |
| `RECAPTCHA_SECRET_KEY` | Secret key pasangan dari site key di atas, dipakai server untuk verifikasi. |
| `GEMINI_MODEL` | Nama model Gemini yang dipakai untuk membuat ringkasan rapat (default: `gemini-2.0-flash`). |
| `DB_CONNECT` | Sumber data aplikasi. `"true"` = database MySQL pada `DATABASE_URL`; `"false"` (default) = data dummy `data/db.json`. |
| `DATABASE_URL` | Koneksi database, dipakai hanya bila `DB_CONNECT="true"`. Contoh: `mysql://root@localhost:3306/notulis_ai`. |
| `DB_STRICT` | Opsional. Bila `"true"`, kegagalan koneksi database dilempar sebagai error alih-alih mundur ke data dummy. Disarankan `"true"` di produksi. |

Catatan: **API key AssemblyAI dan Gemini TIDAK diisi lewat environment variable** — keduanya diinput langsung oleh admin dari halaman **API Key** di dalam aplikasi, dan disimpan di data store (lihat `src/lib/db/store.ts`). Ini memudahkan admin mengganti/menguji API key tanpa perlu redeploy.

## Sumber Data: Dummy JSON atau MySQL

Aplikasi bisa dijalankan **penuh** dengan dua sumber data, dipilih lewat satu variabel `DB_CONNECT` di `.env`:

| `DB_CONNECT` | Sumber data | Implementasi | Perlu MySQL? |
|---|---|---|---|
| `"false"` (default) | `data/db.json` | `src/lib/db/json-store.ts` | Tidak |
| `"true"` | MySQL via Prisma | `src/lib/db/mysql-store.ts` | Ya |

Semua halaman & API route hanya memanggil `src/lib/db/store.ts`, yang memilih salah satu implementasi saat runtime. Bentuk datanya identik (`src/lib/types.ts`), jadi **tampilan dan fitur aplikasi sama persis** di kedua mode — termasuk rekam, transkripsi, ringkasan, dan CRUD admin.

### Mode dummy (tanpa database)

```bash
# .env
DB_CONNECT="false"
```

`data/db.json` dibuat otomatis dari `src/lib/db/seed.ts` saat pertama dijalankan, lalu ikut menyimpan perubahan (tambah rapat, edit admin, isi API key). Hapus file itu untuk mengembalikan data ke kondisi awal.

### Mode MySQL

```bash
# 1. Buat database kosong
mysql -u root -e "CREATE DATABASE IF NOT EXISTS notulis_ai"

# 2. Arahkan .env ke database tersebut
#    DB_CONNECT="true"
#    DATABASE_URL="mysql://root@localhost:3306/notulis_ai"

# 3. Buat tabel + isi data dummy yang sama seperti mode JSON
npm run db:setup
```

Skrip npm yang tersedia:

| Perintah | Kegunaan |
|---|---|
| `npm run db:setup` | `db:push` + `db:seed` — sekali jalan, siap pakai |
| `npm run db:push` | Membuat/menyelaraskan tabel dari `prisma/schema.prisma` |
| `npm run db:seed` | Mengisi ulang data dummy (menghapus data lama dulu) |
| `npm run db:studio` | Membuka Prisma Studio untuk melihat isi tabel |

Tabel yang dibuat: `admin_users`, `meetings`, `speakers`, `transcript_segments`, `meeting_summaries`, `api_key_configs`.

Bila `DB_CONNECT="true"` tetapi database tidak bisa dihubungi, aplikasi menampilkan peringatan di terminal lalu **otomatis mundur ke data dummy JSON** supaya tetap bisa dipakai. Set `DB_STRICT="true"` untuk mematikan perilaku tersebut.

Untuk PostgreSQL, ganti `provider` pada blok `datasource` di `prisma/schema.prisma` menjadi `"postgresql"` dan sesuaikan `DATABASE_URL`. Detail model & catatan keamanan ada di [`MIGRATION.md`](./MIGRATION.md).

## Struktur Proyek (ringkas)

```
src/
  app/                 route Next.js (App Router)
    (admin)/           halaman-halaman admin (dashboard, agenda, hasil-rapat, admin, api-key, panduan)
    api/                route handler (auth, meetings, transcribe, summarize, users, api-keys)
    login/
  components/          komponen UI per fitur + design system (components/ui)
  lib/
    ai/                integrasi AssemblyAI & Gemini
    audio/              deteksi gender dari pitch suara (Web Audio API)
    auth/               sesi login (cookie signed HMAC)
    db/                 repository: store.ts (pemilih sumber data),
                        json-store.ts (dummy), mysql-store.ts (Prisma),
                        seed.ts (data dummy), repository.ts (kontrak)
    pdf/                generator PDF notulen (jsPDF)
  hooks/
    use-meeting-recorder.ts   pengelola state rekaman (MediaRecorder)
prisma/
  schema.prisma         skema database (MySQL/PostgreSQL)
  seed.ts               pengisian data dummy ke database (npm run db:seed)
```

## Deploy ke Produksi — Checklist

1. Isi `SESSION_SECRET` dengan nilai acak yang kuat (mis. `openssl rand -hex 32`).
2. Daftarkan domain Anda di [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin), lalu isi `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` & `RECAPTCHA_SECRET_KEY` dengan key asli.
3. Set `DB_CONNECT="true"` dengan `DATABASE_URL` produksi, jalankan `npm run db:push`, dan set `DB_STRICT="true"` agar kegagalan database tidak diam-diam jatuh ke data dummy.
4. Ganti password akun admin contoh, atau buat akun admin baru lalu nonaktifkan/hapus akun contoh via halaman CRUD Admin.
5. Simpan API key AssemblyAI/Gemini di produksi idealnya dalam bentuk terenkripsi (lihat komentar di `prisma/schema.prisma` pada model `ApiKeyConfig`) — implementasi saat ini menyimpan apa adanya di data store untuk kesederhanaan demo.
6. Jalankan `npm run build && npm run start`, atau deploy ke platform seperti Vercel.

## Catatan Teknis

- Rekaman audio memakai `MediaRecorder` browser (format `audio/webm;codecs=opus` bila didukung), otomatis ditandai tanggal & jam mulai.
- Deteksi gender pembicara ("Bapak"/"Ibu") adalah **heuristik berbasis pitch suara** (bukan model ML terlatih) — hasilnya berupa perkiraan yang bisa diedit manual oleh pengguna.
- Diarization (pemisahan siapa berbicara kapan) memakai fitur speaker labels dari AssemblyAI; ringkasan rapat dibuat Gemini dari transkrip tersebut. Pembagian peran ini terpusat di `src/lib/ai/roles.ts`.
- Selama rekaman berjalan, pratinjau transkrip diminta setiap kali percakapan berhenti sejenak (deteksi jeda dari level mikrofon), dengan cadangan berkala 25 detik bila tidak ada jeda sama sekali.
