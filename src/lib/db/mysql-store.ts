import { randomUUID } from "node:crypto";

import type {
  ActionItem,
  AdminUser,
  ApiKeyConfig,
  Meeting,
  MeetingSummary,
  Speaker,
  TranscriptSegment,
} from "@/lib/types";
import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import type { CreateMeetingInput, NotulisRepository } from "./repository";

// ---------------------------------------------------------------------------
// Implementasi repository berbasis DATABASE MySQL (via Prisma).
//
// Dipakai saat DB_CONNECT="true" di .env. Bentuk data yang dikembalikan SAMA
// PERSIS dengan versi dummy JSON (src/lib/types.ts), sehingga halaman &
// komponen UI tidak perlu tahu sumber datanya dari mana.
//
// Perbedaan bentuk yang dijembatani di file ini:
//   - Meeting.date                    : DATE di MySQL  <-> string "YYYY-MM-DD"
//   - startTime/endTime/createdAt     : DATETIME       <-> string ISO
//   - speakers/transcript/summary     : tabel relasi   <-> objek bersarang
//   - keyPoints/decisions/actionItems : kolom JSON     <-> array
// ---------------------------------------------------------------------------

// --- Konversi tanggal ---------------------------------------------------------

/** "YYYY-MM-DD" menjadi Date UTC tengah malam (kolom bertipe DATE). */
function toDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

/** Date dari kolom DATE menjadi "YYYY-MM-DD" tanpa pergeseran zona waktu. */
function fromDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toNullableDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null;
}

// --- Konversi baris database menjadi tipe aplikasi ----------------------------

const MEETING_INCLUDE = {
  speakers: { orderBy: { colorIndex: "asc" } },
  transcript: { orderBy: { startSec: "asc" } },
  summary: true,
} as const;

type MeetingRow = NonNullable<
  Awaited<ReturnType<typeof prisma.meeting.findUnique<{ where: { id: string }; include: typeof MEETING_INCLUDE }>>>
>;

function toMeeting(row: MeetingRow): Meeting {
  return {
    id: row.id,
    title: row.title,
    date: fromDateOnly(row.date),
    startTime: row.startTime ? row.startTime.toISOString() : null,
    endTime: row.endTime ? row.endTime.toISOString() : null,
    durationSec: row.durationSec,
    status: row.status,
    location: row.location ?? undefined,
    speakers: row.speakers.map(
      (s): Speaker => ({
        id: s.id,
        rawLabel: s.rawLabel,
        displayName: s.displayName,
        gender: s.gender,
        genderConfidence: s.genderConfidence ?? undefined,
        talkTimeSec: s.talkTimeSec,
        colorIndex: s.colorIndex,
      })
    ),
    transcript: row.transcript.map(
      (t): TranscriptSegment => ({
        id: t.id,
        speakerId: t.speakerId,
        text: t.text,
        startSec: t.startSec,
        endSec: t.endSec,
      })
    ),
    summary: row.summary
      ? ({
          overview: row.summary.overview,
          keyPoints: (row.summary.keyPoints ?? []) as string[],
          decisions: (row.summary.decisions ?? []) as string[],
          actionItems: (row.summary.actionItems ?? []) as unknown as ActionItem[],
          generatedAt: row.summary.generatedAt.toISOString(),
          generatedBy: row.summary.generatedBy,
        } satisfies MeetingSummary)
      : null,
    assemblyaiTranscriptId: row.assemblyaiTranscriptId,
    createdBy: row.createdById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type AdminUserRow = NonNullable<Awaited<ReturnType<typeof prisma.adminUser.findFirst>>>;

function toAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    avatarUrl: row.avatarUrl,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
  };
}

type ApiKeyRow = NonNullable<Awaited<ReturnType<typeof prisma.apiKeyConfig.findFirst>>>;

function toApiKeyConfig(row: ApiKeyRow): ApiKeyConfig {
  return {
    provider: row.provider,
    label: row.label,
    apiKey: row.apiKey,
    isConfigured: row.isConfigured,
    lastTestedAt: row.lastTestedAt ? row.lastTestedAt.toISOString() : null,
    lastTestStatus: row.lastTestStatus as ApiKeyConfig["lastTestStatus"],
    updatedAt: row.updatedAt.toISOString(),
  };
}

// --- Meetings -----------------------------------------------------------------

export async function listMeetings(): Promise<Meeting[]> {
  const rows = await prisma.meeting.findMany({
    include: MEETING_INCLUDE,
    // Urutan sekunder createdAt ASC agar sama persis dengan mode dummy JSON
    // (di JSON, rapat pada tanggal yang sama tampil sesuai urutan pembuatan).
    orderBy: [{ date: "desc" }, { createdAt: "asc" }],
  });
  return rows.map(toMeeting);
}

export async function listMeetingsByDate(date: string): Promise<Meeting[]> {
  const rows = await prisma.meeting.findMany({
    where: { date: toDateOnly(date) },
    include: MEETING_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toMeeting);
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  const row = await prisma.meeting.findUnique({ where: { id }, include: MEETING_INCLUDE });
  return row ? toMeeting(row) : null;
}

export async function createMeeting(input: CreateMeetingInput): Promise<Meeting> {
  const row = await prisma.meeting.create({
    data: {
      id: `mtg-${randomUUID()}`,
      title: input.title,
      date: toDateOnly(input.date),
      location: input.location ?? null,
      status: "terjadwal",
      createdById: input.createdBy,
    },
    include: MEETING_INCLUDE,
  });
  return toMeeting(row);
}

/**
 * Patch parsial. Field `speakers`, `transcript`, dan `summary` adalah relasi
 * terpisah di database; bila ikut dikirim, isinya diganti seluruhnya (replace)
 * meniru perilaku spread object pada versi dummy JSON. Semua operasi dibungkus
 * satu transaksi agar rapat tidak pernah tersimpan setengah jalan.
 */
export async function updateMeeting(id: string, patch: Partial<Meeting>): Promise<Meeting | null> {
  const existing = await prisma.meeting.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return null;

  await prisma.$transaction(async (tx) => {
    await tx.meeting.update({
      where: { id },
      data: {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.date !== undefined ? { date: toDateOnly(patch.date) } : {}),
        ...(patch.location !== undefined ? { location: patch.location ?? null } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.startTime !== undefined ? { startTime: toNullableDate(patch.startTime) } : {}),
        ...(patch.endTime !== undefined ? { endTime: toNullableDate(patch.endTime) } : {}),
        ...(patch.durationSec !== undefined ? { durationSec: patch.durationSec } : {}),
        ...(patch.assemblyaiTranscriptId !== undefined
          ? { assemblyaiTranscriptId: patch.assemblyaiTranscriptId ?? null }
          : {}),
      },
    });

    // Segmen transkrip menunjuk ke speaker (foreign key), jadi urutannya:
    // hapus segmen dulu, baru speaker, lalu tulis ulang keduanya.
    if (patch.speakers !== undefined) {
      // Bila hanya nama pembicara yang diubah (patch tanpa transcript), segmen
      // lama harus ditulis ulang dari data tersimpan supaya tidak ikut hilang.
      const keptSegments =
        patch.transcript ??
        (await tx.transcriptSegment.findMany({ where: { meetingId: id } })).map((t) => ({
          id: t.id,
          speakerId: t.speakerId,
          text: t.text,
          startSec: t.startSec,
          endSec: t.endSec,
        }));

      await tx.transcriptSegment.deleteMany({ where: { meetingId: id } });
      await tx.speaker.deleteMany({ where: { meetingId: id } });
      await tx.speaker.createMany({
        data: patch.speakers.map((s) => ({
          id: s.id,
          meetingId: id,
          rawLabel: s.rawLabel,
          displayName: s.displayName,
          gender: s.gender,
          genderConfidence: s.genderConfidence ?? null,
          talkTimeSec: Math.round(s.talkTimeSec),
          colorIndex: s.colorIndex,
        })),
      });
      await tx.transcriptSegment.createMany({
        data: keptSegments.map((t) => ({
          id: t.id,
          meetingId: id,
          speakerId: t.speakerId,
          text: t.text,
          startSec: t.startSec,
          endSec: t.endSec,
        })),
      });
    } else if (patch.transcript !== undefined) {
      await tx.transcriptSegment.deleteMany({ where: { meetingId: id } });
      await tx.transcriptSegment.createMany({
        data: patch.transcript.map((t) => ({
          id: t.id,
          meetingId: id,
          speakerId: t.speakerId,
          text: t.text,
          startSec: t.startSec,
          endSec: t.endSec,
        })),
      });
    }

    if (patch.summary !== undefined) {
      if (patch.summary === null) {
        await tx.meetingSummary.deleteMany({ where: { meetingId: id } });
      } else {
        const s = patch.summary;
        const data = {
          overview: s.overview,
          keyPoints: s.keyPoints,
          decisions: s.decisions,
          // ActionItem[] adalah interface, jadi perlu di-cast ke tipe JSON Prisma.
          actionItems: s.actionItems as unknown as Prisma.InputJsonValue,
          generatedAt: new Date(s.generatedAt),
          generatedBy: s.generatedBy,
        };
        await tx.meetingSummary.upsert({
          where: { meetingId: id },
          create: { id: `sum-${randomUUID()}`, meetingId: id, ...data },
          update: data,
        });
      }
    }
  });

  return getMeeting(id);
}

export async function deleteMeeting(id: string): Promise<boolean> {
  try {
    await prisma.meeting.delete({ where: { id } });
    return true;
  } catch {
    // Prisma P2025 - baris tidak ditemukan.
    return false;
  }
}

// --- Admin Users --------------------------------------------------------------

export async function listUsers(): Promise<AdminUser[]> {
  const rows = await prisma.adminUser.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toAdminUser);
}

export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  // Collation default MySQL (utf8mb4_*_ci) sudah case-insensitive, tapi email
  // tetap dinormalkan ke huruf kecil agar perilakunya sama dengan versi dummy.
  const row = await prisma.adminUser.findFirst({ where: { email: email.toLowerCase() } });
  return row ? toAdminUser(row) : null;
}

export async function getUserById(id: string): Promise<AdminUser | null> {
  const row = await prisma.adminUser.findUnique({ where: { id } });
  return row ? toAdminUser(row) : null;
}

export async function createUser(input: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser> {
  const row = await prisma.adminUser.create({
    data: {
      id: `usr-${randomUUID()}`,
      name: input.name,
      email: input.email.toLowerCase(),
      password: input.password,
      role: input.role,
      avatarUrl: input.avatarUrl ?? null,
      isActive: input.isActive,
    },
  });
  return toAdminUser(row);
}

export async function updateUser(id: string, patch: Partial<AdminUser>): Promise<AdminUser | null> {
  const existing = await prisma.adminUser.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return null;

  const row = await prisma.adminUser.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.email !== undefined ? { email: patch.email.toLowerCase() } : {}),
      ...(patch.password !== undefined ? { password: patch.password } : {}),
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      ...(patch.avatarUrl !== undefined ? { avatarUrl: patch.avatarUrl ?? null } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    },
  });
  return toAdminUser(row);
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await prisma.adminUser.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// --- API Keys -----------------------------------------------------------------

export async function listApiKeys(): Promise<ApiKeyConfig[]> {
  const rows = await prisma.apiKeyConfig.findMany({ orderBy: { provider: "asc" } });
  return rows.map(toApiKeyConfig);
}

export async function getApiKey(provider: ApiKeyConfig["provider"]): Promise<ApiKeyConfig | null> {
  const row = await prisma.apiKeyConfig.findUnique({ where: { provider } });
  return row ? toApiKeyConfig(row) : null;
}

export async function upsertApiKey(
  provider: ApiKeyConfig["provider"],
  patch: Partial<ApiKeyConfig>
): Promise<ApiKeyConfig> {
  const defaults = {
    label: provider === "assemblyai" ? "AssemblyAI" : "Google Gemini",
    apiKey: "",
    isConfigured: false,
    lastTestedAt: null as Date | null,
    lastTestStatus: "belum_diuji",
  };
  const changes = {
    ...(patch.label !== undefined ? { label: patch.label } : {}),
    ...(patch.apiKey !== undefined ? { apiKey: patch.apiKey } : {}),
    ...(patch.isConfigured !== undefined ? { isConfigured: patch.isConfigured } : {}),
    ...(patch.lastTestedAt !== undefined ? { lastTestedAt: toNullableDate(patch.lastTestedAt) } : {}),
    ...(patch.lastTestStatus !== undefined ? { lastTestStatus: patch.lastTestStatus } : {}),
  };

  const row = await prisma.apiKeyConfig.upsert({
    where: { provider },
    create: { provider, ...defaults, ...changes },
    update: changes,
  });
  return toApiKeyConfig(row);
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
