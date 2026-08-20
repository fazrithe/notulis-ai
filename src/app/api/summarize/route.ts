import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { getSessionUserId } from "@/lib/auth/session";
import { getApiKey, getMeeting, updateMeeting } from "@/lib/db/store";
import { GeminiError, summarizeWithGemini } from "@/lib/ai/gemini";
import { PROVIDER_LABEL, SUMMARY_PROVIDER } from "@/lib/ai/roles";
import type { ActionItem } from "@/lib/types";

export const maxDuration = 120;

// Ringkasan/kesimpulan rapat SELALU dibuat Gemini, memakai transkrip hasil
// diarization AssemblyAI yang sudah tersimpan di rapat ini.
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  const meetingId = typeof body?.meetingId === "string" ? body.meetingId : "";

  const meeting = meetingId ? await getMeeting(meetingId) : null;
  if (!meeting) return NextResponse.json({ ok: false, message: "Rapat tidak ditemukan." }, { status: 404 });
  if (!meeting.transcript.length) {
    return NextResponse.json({ ok: false, message: "Rapat ini belum memiliki transkrip." }, { status: 400 });
  }

  const keyConfig = await getApiKey(SUMMARY_PROVIDER);
  if (!keyConfig?.isConfigured || !keyConfig.apiKey) {
    return NextResponse.json(
      {
        ok: false,
        code: "missing_api_key",
        missing: [SUMMARY_PROVIDER],
        message: `API key ${PROVIDER_LABEL[SUMMARY_PROVIDER]} belum dikonfigurasi. Atur dulu di halaman API Key.`,
      },
      { status: 400 }
    );
  }

  const speakerNameById = new Map(meeting.speakers.map((s) => [s.id, s.displayName]));
  const transcriptText = meeting.transcript
    .map((seg) => `${speakerNameById.get(seg.speakerId) ?? "Peserta"}: ${seg.text}`)
    .join("\n");

  try {
    const result = await summarizeWithGemini(keyConfig.apiKey, transcriptText);

    const actionItems: ActionItem[] = (result.actionItems ?? []).map((a) => ({
      id: `ai-${randomUUID()}`,
      task: a.task,
      owner: a.owner,
      due: a.due ?? null,
      done: false,
    }));

    const summary = {
      overview: result.overview ?? "",
      keyPoints: result.keyPoints ?? [],
      decisions: result.decisions ?? [],
      actionItems,
      generatedAt: new Date().toISOString(),
      generatedBy: SUMMARY_PROVIDER,
    };

    const updated = await updateMeeting(meeting.id, { summary, status: "selesai" as const });
    return NextResponse.json({ ok: true, meeting: updated });
  } catch (err) {
    const message =
      err instanceof GeminiError
        ? err.message
        : "Gagal membuat ringkasan. Periksa kembali API key Gemini Anda.";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
