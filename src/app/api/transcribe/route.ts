import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { getApiKey } from "@/lib/db/store";
import { AssemblyAiError, transcribeWithAssemblyAi } from "@/lib/ai/assemblyai";
import { PROVIDER_LABEL, TRANSCRIPTION_PROVIDER } from "@/lib/ai/roles";

export const maxDuration = 300;

interface NormalizedSegment {
  speakerRawLabel: string;
  text: string;
  startSec: number;
  endSec: number;
}

// Transkripsi + pemisahan pembicara SELALU lewat AssemblyAI. Ringkasannya
// ditangani Gemini di /api/summarize.
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("audio");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "File audio tidak ditemukan." }, { status: 400 });
  }

  const keyConfig = await getApiKey(TRANSCRIPTION_PROVIDER);
  if (!keyConfig?.isConfigured || !keyConfig.apiKey) {
    return NextResponse.json(
      {
        ok: false,
        code: "missing_api_key",
        missing: [TRANSCRIPTION_PROVIDER],
        message: `API key ${PROVIDER_LABEL[TRANSCRIPTION_PROVIDER]} belum dikonfigurasi. Atur dulu di halaman API Key.`,
      },
      { status: 400 }
    );
  }

  const audioBuffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await transcribeWithAssemblyAi(keyConfig.apiKey, audioBuffer);
    const segments: NormalizedSegment[] = result.utterances.map((u) => ({
      speakerRawLabel: `Speaker ${u.speaker}`,
      text: u.text,
      startSec: u.start / 1000,
      endSec: u.end / 1000,
    }));
    return NextResponse.json({
      ok: true,
      provider: TRANSCRIPTION_PROVIDER,
      assemblyaiTranscriptId: result.transcriptId,
      fullText: result.fullText,
      segments,
    });
  } catch (err) {
    const message =
      err instanceof AssemblyAiError
        ? err.message
        : "Gagal memproses transkripsi. Periksa kembali API key AssemblyAI dan koneksi internet.";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
