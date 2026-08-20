// ---------------------------------------------------------------------------
// Integrasi AssemblyAI — dipakai HANYA untuk transkripsi + speaker diarization.
// Ringkasan rapat ditangani Gemini (lihat src/lib/ai/gemini.ts & roles.ts).
// Dokumentasi: https://www.assemblyai.com/docs
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.assemblyai.com/v2";

export interface AssemblyAiUtterance {
  speaker: string;
  text: string;
  start: number; // ms
  end: number; // ms
}

export interface AssemblyAiTranscriptResult {
  transcriptId: string;
  fullText: string;
  utterances: AssemblyAiUtterance[];
}

export class AssemblyAiError extends Error {}

async function uploadAudio(apiKey: string, audio: Buffer): Promise<string> {
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    headers: { authorization: apiKey, "content-type": "application/octet-stream" },
    body: new Uint8Array(audio),
  });
  if (!res.ok) {
    throw new AssemblyAiError(`Gagal mengunggah audio ke AssemblyAI (status ${res.status}).`);
  }
  const data = (await res.json()) as { upload_url: string };
  return data.upload_url;
}

async function createTranscript(apiKey: string, audioUrl: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/transcript`, {
    method: "POST",
    headers: { authorization: apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: true,
      language_code: "id",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AssemblyAiError(`Gagal membuat job transkripsi AssemblyAI (status ${res.status}). ${body}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

async function pollTranscript(apiKey: string, id: string, timeoutMs = 120_000): Promise<AssemblyAiTranscriptResult> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE_URL}/transcript/${id}`, {
      headers: { authorization: apiKey },
    });
    if (!res.ok) {
      throw new AssemblyAiError(`Gagal mengambil status transkripsi (status ${res.status}).`);
    }
    const data = (await res.json()) as {
      status: "queued" | "processing" | "completed" | "error";
      text?: string;
      utterances?: AssemblyAiUtterance[];
      error?: string;
    };
    if (data.status === "completed") {
      return { transcriptId: id, fullText: data.text ?? "", utterances: data.utterances ?? [] };
    }
    if (data.status === "error") {
      throw new AssemblyAiError(data.error || "AssemblyAI gagal memproses transkripsi.");
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new AssemblyAiError("Waktu tunggu transkripsi AssemblyAI habis. Coba lagi untuk rekaman yang lebih pendek.");
}

export async function transcribeWithAssemblyAi(apiKey: string, audio: Buffer): Promise<AssemblyAiTranscriptResult> {
  const uploadUrl = await uploadAudio(apiKey, audio);
  const transcriptId = await createTranscript(apiKey, uploadUrl);
  return pollTranscript(apiKey, transcriptId);
}

export async function testAssemblyAiKey(apiKey: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/transcript?limit=1`, { headers: { authorization: apiKey } });
  return res.ok;
}
