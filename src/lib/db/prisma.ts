import { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Prisma Client singleton.
//
// Di mode development Next.js melakukan hot-reload berkali-kali; tanpa cache di
// globalThis setiap reload akan membuat koneksi baru sampai MySQL menolak
// ("too many connections"). Pola ini adalah rekomendasi resmi Prisma untuk Next.
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
