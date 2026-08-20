import { PrismaClient, type Prisma } from "@prisma/client";

import { SEED_ADMIN_USERS, SEED_API_KEYS, SEED_MEETINGS } from "../src/lib/db/seed";

// ---------------------------------------------------------------------------
// Pengisian data dummy ke database MySQL.
//
//   npm run db:setup   -> buat/selaraskan tabel lalu isi data ini
//   npm run db:seed    -> isi ulang data saja
//
// Sumber datanya SAMA dengan mode dummy JSON (src/lib/db/seed.ts), jadi
// tampilan aplikasi identik baik DB_CONNECT="true" maupun "false".
//
// Skrip ini idempotent: dijalankan berkali-kali hasilnya tetap sama karena
// data lama dihapus dulu sebelum ditulis ulang.
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

/** "YYYY-MM-DD" menjadi Date UTC tengah malam (kolom bertipe DATE). */
function dateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
}

async function main() {
  console.log("Menghapus data lama...");
  // Urutan penting: anak dulu, baru induk (mengikuti foreign key).
  await prisma.transcriptSegment.deleteMany();
  await prisma.meetingSummary.deleteMany();
  await prisma.speaker.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.apiKeyConfig.deleteMany();

  console.log(`Mengisi ${SEED_ADMIN_USERS.length} admin...`);
  for (const user of SEED_ADMIN_USERS) {
    await prisma.adminUser.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase(),
        // CATATAN: masih plain text untuk kemudahan demo. Di produksi WAJIB
        // di-hash (bcrypt/argon2) — lihat MIGRATION.md bagian keamanan.
        password: user.password,
        role: user.role,
        avatarUrl: user.avatarUrl ?? null,
        isActive: user.isActive,
        createdAt: new Date(user.createdAt),
      },
    });
  }

  console.log(`Mengisi ${SEED_MEETINGS.length} rapat beserta relasinya...`);
  for (const meeting of SEED_MEETINGS) {
    await prisma.meeting.create({
      data: {
        id: meeting.id,
        title: meeting.title,
        date: dateOnly(meeting.date),
        startTime: meeting.startTime ? new Date(meeting.startTime) : null,
        endTime: meeting.endTime ? new Date(meeting.endTime) : null,
        durationSec: meeting.durationSec,
        status: meeting.status,
        location: meeting.location ?? null,
        assemblyaiTranscriptId: meeting.assemblyaiTranscriptId ?? null,
        createdById: meeting.createdBy,
        createdAt: new Date(meeting.createdAt),
        updatedAt: new Date(meeting.updatedAt),
        // Di JSON ketiganya objek bersarang, di database jadi tabel terpisah.
        speakers: {
          create: meeting.speakers.map((s) => ({
            id: s.id,
            rawLabel: s.rawLabel,
            displayName: s.displayName,
            gender: s.gender,
            genderConfidence: s.genderConfidence ?? null,
            talkTimeSec: Math.round(s.talkTimeSec),
            colorIndex: s.colorIndex,
          })),
        },
      },
    });

    // Segmen dibuat setelah speaker karena menunjuk ke speakerId.
    if (meeting.transcript.length) {
      await prisma.transcriptSegment.createMany({
        data: meeting.transcript.map((t) => ({
          id: t.id,
          meetingId: meeting.id,
          speakerId: t.speakerId,
          text: t.text,
          startSec: t.startSec,
          endSec: t.endSec,
        })),
      });
    }

    if (meeting.summary) {
      await prisma.meetingSummary.create({
        data: {
          id: `sum-${meeting.id}`,
          meetingId: meeting.id,
          overview: meeting.summary.overview,
          keyPoints: meeting.summary.keyPoints,
          decisions: meeting.summary.decisions,
          actionItems: meeting.summary.actionItems as unknown as Prisma.InputJsonValue,
          generatedAt: new Date(meeting.summary.generatedAt),
          generatedBy: meeting.summary.generatedBy,
        },
      });
    }
  }

  console.log(`Mengisi ${SEED_API_KEYS.length} slot API key...`);
  for (const key of SEED_API_KEYS) {
    await prisma.apiKeyConfig.create({
      data: {
        provider: key.provider,
        label: key.label,
        // Sengaja kosong — diisi user dari halaman "API Key" setelah login.
        apiKey: key.apiKey,
        isConfigured: key.isConfigured,
        lastTestedAt: key.lastTestedAt ? new Date(key.lastTestedAt) : null,
        lastTestStatus: key.lastTestStatus,
        updatedAt: new Date(key.updatedAt),
      },
    });
  }

  const counts = {
    admin_users: await prisma.adminUser.count(),
    meetings: await prisma.meeting.count(),
    speakers: await prisma.speaker.count(),
    transcript_segments: await prisma.transcriptSegment.count(),
    meeting_summaries: await prisma.meetingSummary.count(),
    api_key_configs: await prisma.apiKeyConfig.count(),
  };
  console.log("Selesai. Isi tabel sekarang:", counts);
  console.log("Login demo: admin@notulis.com / Notul!s&888");
}

main()
  .catch((err) => {
    console.error("Seed gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
