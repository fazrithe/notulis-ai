import type { AdminUser, ApiKeyConfig, Meeting } from "@/lib/types";

// ---------------------------------------------------------------------------
// Kontrak repository aplikasi.
//
// Ada DUA implementasi yang memenuhi kontrak ini:
//   - src/lib/db/json-store.ts   -> data dummy dari data/db.json (DB_CONNECT=false)
//   - src/lib/db/mysql-store.ts  -> database MySQL via Prisma    (DB_CONNECT=true)
//
// src/lib/db/store.ts memilih salah satunya saat runtime. Semua fungsi dibuat
// async agar bentuk pemanggilannya identik untuk kedua implementasi — halaman
// dan API route cukup memakai `await`, tanpa peduli sumber datanya apa.
// ---------------------------------------------------------------------------

export interface CreateMeetingInput {
  title: string;
  date: string;
  location?: string;
  createdBy: string;
}

export interface NotulisRepository {
  // --- Meetings ---
  listMeetings(): Promise<Meeting[]>;
  listMeetingsByDate(date: string): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | null>;
  createMeeting(input: CreateMeetingInput): Promise<Meeting>;
  updateMeeting(id: string, patch: Partial<Meeting>): Promise<Meeting | null>;
  deleteMeeting(id: string): Promise<boolean>;

  // --- Admin users ---
  listUsers(): Promise<AdminUser[]>;
  getUserByEmail(email: string): Promise<AdminUser | null>;
  getUserById(id: string): Promise<AdminUser | null>;
  createUser(input: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser>;
  updateUser(id: string, patch: Partial<AdminUser>): Promise<AdminUser | null>;
  deleteUser(id: string): Promise<boolean>;

  // --- API keys ---
  listApiKeys(): Promise<ApiKeyConfig[]>;
  getApiKey(provider: ApiKeyConfig["provider"]): Promise<ApiKeyConfig | null>;
  upsertApiKey(
    provider: ApiKeyConfig["provider"],
    patch: Partial<ApiKeyConfig>
  ): Promise<ApiKeyConfig>;
}
