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

export const DB_CONNECT = readBoolEnv(process.env.DB_CONNECT);

export const DATABASE_URL = (process.env.DATABASE_URL ?? "").trim();

/**
 * Bila true dan koneksi database gagal saat pertama dipakai, aplikasi otomatis
 * mundur ke data dummy JSON supaya tetap bisa dipakai (demo tidak mati total).
 * Set DB_STRICT="true" di .env untuk mematikan perilaku ini dan melempar error.
 */
export const DB_FALLBACK_TO_DUMMY = !readBoolEnv(process.env.DB_STRICT);
