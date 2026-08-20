import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { listApiKeys, upsertApiKey } from "@/lib/db/store";
import { missingProviders } from "@/lib/ai/roles";
import { maskApiKey as mask } from "@/lib/utils";
import type { AiProvider } from "@/lib/types";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const all = await listApiKeys();
  const keys = all.map((k) => ({ ...k, apiKey: mask(k.apiKey) }));
  const missing = missingProviders(all);

  // `missing`/`ready` dipakai client untuk mencegah rekaman dimulai sebelum
  // kedua API key terisi (lihat src/hooks/use-api-key-guard.ts).
  return NextResponse.json({ ok: true, apiKeys: keys, missing, ready: missing.length === 0 });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  const provider = body?.provider as AiProvider;
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";

  if (provider !== "assemblyai" && provider !== "gemini") {
    return NextResponse.json({ ok: false, message: "Provider tidak valid." }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ ok: false, message: "API key tidak boleh kosong." }, { status: 400 });
  }

  const updated = await upsertApiKey(provider, {
    apiKey,
    isConfigured: true,
    lastTestStatus: "belum_diuji",
    lastTestedAt: null,
  });

  return NextResponse.json({ ok: true, apiKey: { ...updated, apiKey: mask(updated.apiKey) } });
}
