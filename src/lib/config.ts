// ---------------------------------------------------------------------------
// Konfigurasi terpusat lewat environment variable.
//
// Kunci reCAPTCHA di bawah adalah "kunci uji" resmi dari Google yang SELALU
// meloloskan verifikasi (dipakai Google sendiri untuk contoh/testing) —
// dipakai sebagai default supaya demo ini langsung bisa dicoba tanpa setup.
// GANTI dengan site key & secret key asli dari
// https://www.google.com/recaptcha/admin sebelum deploy ke produksi.
// ---------------------------------------------------------------------------

export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

export const RECAPTCHA_SECRET_KEY =
  process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

export const APP_NAME = "Notulis AI";

// ---------------------------------------------------------------------------
// Pemilihan sumber data: database MySQL (Prisma) atau data dummy JSON.
//
//   DB_CONNECT="true"  -> pakai database di DATABASE_URL (src/lib/db/mysql-store.ts)
//   DB_CONNECT="false" -> pakai data dummy data/db.json (src/lib/db/json-store.ts)
//
// Nilai dinormalisasi secara defensif karena penulisan di .env bisa beragam
// (mis. `DB_CONNECT = "true"`, `DB_CONNECT=TRUE`, atau `DB_CONNECT=1`).
// ---------------------------------------------------------------------------

function readBoolEnv(raw: string | undefined): boolean {
  const value = (raw ?? "").trim().replace(/^["']|["']$/g, "").toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

export const DATABASE_URL = (process.env.DATABASE_URL ?? "").trim();

/** True saat aplikasi berjalan di serverless Vercel (env ini diisi Vercel sendiri). */
export const IS_VERCEL = Boolean(process.env.VERCEL);

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

/** Host pada DATABASE_URL; string kosong bila URL tidak valid/kosong. */
function databaseHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/**
 * DATABASE_URL menunjuk ke mesin lokal (mis. `mysql://root@localhost:3306/...`)?
 * Dari dalam Vercel, "localhost" adalah container fungsi itu sendiri — MySQL di
 * laptop developer mustahil dijangkau dari sana.
 */
const DATABASE_URL_IS_LOCAL = LOCAL_DB_HOSTS.has(databaseHost(DATABASE_URL));

/**
 * Di Vercel, DB_CONNECT="true" yang mengarah ke database lokal dipaksa menjadi
 * mode dummy. Tanpa ini setiap request menunggu koneksi MySQL yang tidak akan
 * pernah berhasil sebelum akhirnya mundur ke dummy — lambat dan berisik di log.
 *
 * Begitu DATABASE_URL di dashboard Vercel diganti ke database yang benar-benar
 * bisa diakses publik, pemaksaan ini otomatis berhenti dan Prisma dipakai lagi.
 */
export const DUMMY_FORCED_BY_VERCEL =
  IS_VERCEL && readBoolEnv(process.env.DB_CONNECT) && (DATABASE_URL_IS_LOCAL || !DATABASE_URL);

export const DB_CONNECT = readBoolEnv(process.env.DB_CONNECT) && !DUMMY_FORCED_BY_VERCEL;

/**
 * Bila true dan koneksi database gagal saat pertama dipakai, aplikasi otomatis
 * mundur ke data dummy JSON supaya tetap bisa dipakai (demo tidak mati total).
 * Set DB_STRICT="true" di .env untuk mematikan perilaku ini dan melempar error.
 */
export const DB_FALLBACK_TO_DUMMY = !readBoolEnv(process.env.DB_STRICT);
