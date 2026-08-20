import type { AdminUser, ApiKeyConfig, Meeting } from "@/lib/types";
import {
  DATABASE_URL,
  DB_CONNECT,
  DB_FALLBACK_TO_DUMMY,
  DUMMY_FORCED_BY_VERCEL,
} from "@/lib/config";
import * as jsonStore from "./json-store";
import type { CreateMeetingInput, NotulisRepository } from "./repository";

// ---------------------------------------------------------------------------
// Repository layer — SATU pintu masuk untuk semua akses data aplikasi.
//
// Sumber data dipilih otomatis dari .env:
//
//   DB_CONNECT="true"   -> MySQL lewat Prisma  (./mysql-store.ts)
//   DB_CONNECT="false"  -> data dummy JSON     (./json-store.ts)
//
// Halaman dan API route cukup memanggil fungsi di file ini dan tidak perlu
// tahu implementasi mana yang aktif — bentuk datanya identik (src/lib/types.ts).
//
// Modul MySQL di-import secara dinamis supaya @prisma/client TIDAK ikut dimuat
// saat mode dummy; dengan begitu aplikasi tetap jalan walau `prisma generate`
// belum pernah dijalankan atau MySQL tidak terpasang sama sekali.
// ---------------------------------------------------------------------------

let repoPromise: Promise<NotulisRepository> | null = null;
let activeSource: "mysql" | "dummy" = DB_CONNECT ? "mysql" : "dummy";

/** Sumber data yang benar-benar dipakai (berguna untuk log/diagnostik). */
export function currentDataSource(): "mysql" | "dummy" {
  return activeSource;
}

async function loadRepository(): Promise<NotulisRepository> {
  if (!DB_CONNECT) {
    if (DUMMY_FORCED_BY_VERCEL) {
      console.info(
        `[notulis-ai] Berjalan di Vercel dengan DATABASE_URL yang menunjuk ke host lokal — ` +
          `memakai data dummy. Isi DATABASE_URL di dashboard Vercel dengan database yang ` +
          `bisa diakses publik bila ingin memakai Prisma/MySQL di sana.`
      );
    }
    activeSource = "dummy";
    return jsonStore;
  }

  if (!DATABASE_URL) {
    const message =
      "DB_CONNECT=true tetapi DATABASE_URL kosong di .env — isi DATABASE_URL terlebih dahulu.";
    if (!DB_FALLBACK_TO_DUMMY) throw new Error(message);
    console.warn(`[notulis-ai] ${message} Sementara memakai data dummy JSON.`);
    activeSource = "dummy";
    return jsonStore;
  }

  try {
    const mysqlStore = (await import("./mysql-store")) as NotulisRepository;
    // Sekali "ping" agar kegagalan koneksi/tabel ketahuan sekarang, bukan
    // setengah jalan saat user sedang merekam rapat.
    const { prisma } = await import("./prisma");
    await prisma.$queryRaw`SELECT 1`;
    activeSource = "mysql";
    return mysqlStore;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const message = `Gagal terhubung ke database (${DATABASE_URL.replace(/\/\/[^@]*@/, "//***@")}): ${detail}`;
    if (!DB_FALLBACK_TO_DUMMY) throw new Error(message);
    console.warn(
      `[notulis-ai] ${message}\n[notulis-ai] Mundur ke data dummy JSON agar aplikasi tetap bisa dipakai. ` +
        `Jalankan "npm run db:setup" untuk membuat tabel & mengisi data awal.`
    );
    activeSource = "dummy";
    return jsonStore;
  }
}

function repo(): Promise<NotulisRepository> {
  // Hasil resolusi di-cache; bila gagal, coba lagi pada pemanggilan berikutnya
  // supaya database yang baru dinyalakan bisa langsung terpakai tanpa restart.
  repoPromise ??= loadRepository().catch((err) => {
    repoPromise = null;
    throw err;
  });
  return repoPromise;
}

// --- Meetings -----------------------------------------------------------------

export async function listMeetings(): Promise<Meeting[]> {
  return (await repo()).listMeetings();
}

export async function listMeetingsByDate(date: string): Promise<Meeting[]> {
  return (await repo()).listMeetingsByDate(date);
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  return (await repo()).getMeeting(id);
}

export async function createMeeting(input: CreateMeetingInput): Promise<Meeting> {
  return (await repo()).createMeeting(input);
}

export async function updateMeeting(id: string, patch: Partial<Meeting>): Promise<Meeting | null> {
  return (await repo()).updateMeeting(id, patch);
}

export async function deleteMeeting(id: string): Promise<boolean> {
  return (await repo()).deleteMeeting(id);
}

// --- Admin Users --------------------------------------------------------------

export async function listUsers(): Promise<AdminUser[]> {
  return (await repo()).listUsers();
}

export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  return (await repo()).getUserByEmail(email);
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  return (await repo()).getUserById(id);
}

export async function createUser(input: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser> {
  return (await repo()).createUser(input);
}

export async function updateUser(id: string, patch: Partial<AdminUser>): Promise<AdminUser | null> {
  return (await repo()).updateUser(id, patch);
}

export async function deleteUser(id: string): Promise<boolean> {
  return (await repo()).deleteUser(id);
}

// --- API Keys -----------------------------------------------------------------

export async function listApiKeys(): Promise<ApiKeyConfig[]> {
  return (await repo()).listApiKeys();
}

/** Mengambil key satu provider — dipakai route transkripsi & ringkasan. */
export async function getApiKey(
  provider: ApiKeyConfig["provider"]
): Promise<ApiKeyConfig | null> {
  return (await repo()).getApiKey(provider);
}

export async function upsertApiKey(
  provider: ApiKeyConfig["provider"],
  patch: Partial<ApiKeyConfig>
): Promise<ApiKeyConfig> {
  return (await repo()).upsertApiKey(provider, patch);
}
