import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { listApiKeys, upsertApiKey } from "@/lib/db/store";
import { testAssemblyAiKey } from "@/lib/ai/assemblyai";
import { testGeminiKey } from "@/lib/ai/gemini";
import type { AiProvider } from "@/lib/types";

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  const provider = body?.provider as AiProvider;

  const keys = await listApiKeys();
  const keyConfig = keys.find((k) => k.provider === provider);
  if (!keyConfig?.apiKey) {
    return NextResponse.json({ ok: false, message: "API key belum diisi." }, { status: 400 });
  }

  const success =
    provider === "assemblyai" ? await testAssemblyAiKey(keyConfig.apiKey) : await testGeminiKey(keyConfig.apiKey);

  const updated = await upsertApiKey(provider, {
    lastTestedAt: new Date().toISOString(),
    lastTestStatus: success ? "berhasil" : "gagal",
  });

  return NextResponse.json({ ok: success, status: updated.lastTestStatus });
}
