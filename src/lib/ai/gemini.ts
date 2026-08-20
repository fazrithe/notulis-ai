// ---------------------------------------------------------------------------
// Integrasi Google Gemini — dipakai HANYA untuk ringkasan/kesimpulan rapat.
// Transkripsi + pemisahan pembicara ditangani AssemblyAI (lihat roles.ts).
// Dokumentasi: https://ai.google.dev/gemini-api/docs
// ---------------------------------------------------------------------------

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export class GeminiError extends Error {}

function extractJson(raw: string): string {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i) || raw.match(/```\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return candidate.trim();
  return candidate.slice(start, end + 1);
}

export interface GeminiSummaryResult {
  overview: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: { task: string; owner: string; due: string | null }[];
}

export async function summarizeWithGemini(apiKey: string, transcriptText: string): Promise<GeminiSummaryResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = [
    "Kamu adalah asisten notulen rapat profesional. Berdasarkan transkrip rapat berikut (Bahasa Indonesia),",
    "buatlah ringkasan rapat yang jelas dan actionable.",
    "Kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan lain) dengan struktur persis:",
    '{"overview":"ringkasan 2-4 kalimat","keyPoints":["poin penting 1","poin penting 2"],"decisions":["keputusan 1"],"actionItems":[{"task":"tugas","owner":"nama/label pembicara penanggung jawab","due":"YYYY-MM-DD atau null"}]}',
    "",
    "Transkrip:",
    transcriptText,
  ].join("\n");

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  try {
    return JSON.parse(extractJson(text)) as GeminiSummaryResult;
  } catch {
    throw new GeminiError("Gagal membaca hasil ringkasan dari Gemini (format tidak sesuai).");
  }
}

export async function testGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    await model.generateContent("Balas dengan kata 'ok' saja.");
    return true;
  } catch {
    return false;
  }
}
