import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { AdminUser, ApiKeyConfig, Meeting } from "@/lib/types";
import { SEED_ADMIN_USERS, SEED_API_KEYS, SEED_MEETINGS } from "./seed";
import type { CreateMeetingInput, NotulisRepository } from "./repository";

// ---------------------------------------------------------------------------
// Implementasi repository berbasis DATA DUMMY (file JSON).
//
// Dipakai saat DB_CONNECT="false" di .env — tidak butuh MySQL sama sekali,
// jadi aplikasi tetap bisa dijalankan & didemokan tanpa database.
// Data awal diambil dari ./seed.ts lalu dipersistensikan ke data/db.json
// supaya perubahan (tambah rapat, edit user, isi API key) tidak hilang saat
// halaman di-refresh.
//
// Fungsi di sini sengaja dibuat `async` walau operasi filenya sinkron, agar
// signature-nya identik dengan versi MySQL (lihat ./repository.ts).
// ---------------------------------------------------------------------------

interface DbShape {
  users: AdminUser[];
  meetings: Meeting[];
  apiKeys: ApiKeyConfig[];
}

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function seedShape(): DbShape {
  return {
    users: SEED_ADMIN_USERS,
    meetings: SEED_MEETINGS,
    apiKeys: SEED_API_KEYS,
  };
}

function ensureDb(): DbShape {
  if (!fs.existsSync(DB_PATH)) {
    const initial = seedShape();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw) as DbShape;
  } catch {
    // File korup — reset ke seed supaya app tidak crash saat demo.
    const initial = seedShape();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

function saveDb(db: DbShape) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

// --- Pembanding urutan ---------------------------------------------------------

/** Bandingkan dua string ISO/tanggal menaik; 0 bila sama (urutan asli dipertahankan). */
function compareAsc(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Kebalikan compareAsc — terbaru lebih dulu. */
function compareDesc(a: string, b: string): number {
  return compareAsc(b, a);
}

// --- Meetings ---------------------------------------------------------------

export async function listMeetings(): Promise<Meeting[]> {
  // Urutan WAJIB sama dengan mode MySQL (lihat mysql-store.listMeetings):
  // tanggal terbaru dulu, lalu rapat pada tanggal sama sesuai urutan pembuatan.
  // Comparator mengembalikan 0 saat sama supaya urutannya deterministik —
  // comparator yang tidak pernah 0 membuat hasil sort berbalik arah.
  return [...ensureDb().meetings].sort(
    (a, b) => compareDesc(a.date, b.date) || compareAsc(a.createdAt, b.createdAt)
  );
}

export async function listMeetingsByDate(date: string): Promise<Meeting[]> {
  return (await listMeetings()).filter((m) => m.date === date);
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  return ensureDb().meetings.find((m) => m.id === id) ?? null;
}

export async function createMeeting(input: CreateMeetingInput): Promise<Meeting> {
  const db = ensureDb();
  const now = new Date().toISOString();
  const meeting: Meeting = {
    id: `mtg-${randomUUID()}`,
    title: input.title,
    date: input.date,
    location: input.location,
    startTime: null,
    endTime: null,
    durationSec: 0,
    status: "terjadwal",
    speakers: [],
    transcript: [],
    summary: null,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  db.meetings.push(meeting);
  saveDb(db);
  return meeting;
}

export async function updateMeeting(id: string, patch: Partial<Meeting>): Promise<Meeting | null> {
  const db = ensureDb();
  const idx = db.meetings.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.meetings[idx] = {
    ...db.meetings[idx],
    ...patch,
    id: db.meetings[idx].id,
    updatedAt: new Date().toISOString(),
  };
  saveDb(db);
  return db.meetings[idx];
}

export async function deleteMeeting(id: string): Promise<boolean> {
  const db = ensureDb();
  const before = db.meetings.length;
  db.meetings = db.meetings.filter((m) => m.id !== id);
  saveDb(db);
  return db.meetings.length < before;
}

// --- Admin Users --------------------------------------------------------------

export async function listUsers(): Promise<AdminUser[]> {
  // Sama dengan mysql-store.listUsers: yang terbaru di atas.
  return [...ensureDb().users].sort((a, b) => compareDesc(a.createdAt, b.createdAt));
}

export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  return (
    ensureDb().users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
  );
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  return ensureDb().users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser> {
  const db = ensureDb();
  const user: AdminUser = {
    ...input,
    id: `usr-${randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  saveDb(db);
  return user;
}

export async function updateUser(id: string, patch: Partial<AdminUser>): Promise<AdminUser | null> {
  const db = ensureDb();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...patch, id: db.users[idx].id };
  saveDb(db);
  return db.users[idx];
}

export async function deleteUser(id: string): Promise<boolean> {
  const db = ensureDb();
  const before = db.users.length;
  db.users = db.users.filter((u) => u.id !== id);
  saveDb(db);
  return db.users.length < before;
}

// --- API Keys -----------------------------------------------------------------

export async function listApiKeys(): Promise<ApiKeyConfig[]> {
  return ensureDb().apiKeys;
}

/** Mengambil key satu provider — dipakai route transkripsi & ringkasan. */
export async function getApiKey(
  provider: ApiKeyConfig["provider"]
): Promise<ApiKeyConfig | null> {
  return ensureDb().apiKeys.find((k) => k.provider === provider) ?? null;
}

export async function upsertApiKey(
  provider: ApiKeyConfig["provider"],
  patch: Partial<ApiKeyConfig>
): Promise<ApiKeyConfig> {
  const db = ensureDb();
  const idx = db.apiKeys.findIndex((k) => k.provider === provider);
  const now = new Date().toISOString();
  if (idx === -1) {
    const created: ApiKeyConfig = {
      provider,
      label: provider === "assemblyai" ? "AssemblyAI" : "Google Gemini",
      apiKey: "",
      isConfigured: false,
      lastTestedAt: null,
      lastTestStatus: "belum_diuji",
      updatedAt: now,
      ...patch,
    };
    db.apiKeys.push(created);
    saveDb(db);
    return created;
  }
  db.apiKeys[idx] = { ...db.apiKeys[idx], ...patch, provider, updatedAt: now };
  saveDb(db);
  return db.apiKeys[idx];
}

// Pemeriksaan tipe saat compile: modul ini wajib memenuhi kontrak repository.
const _typecheck: NotulisRepository = {
  listMeetings,
  listMeetingsByDate,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  listUsers,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  listApiKeys,
  getApiKey,
  upsertApiKey,
};
void _typecheck;
