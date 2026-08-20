// ---------------------------------------------------------------------------
// Pembagian peran provider AI.
//
// Notulis AI memakai KEDUA provider sekaligus — bukan salah satu sebagai
// alternatif — dengan peran yang tetap:
//   • AssemblyAI → transkripsi + pemisahan pembicara (speaker diarization)
//   • Gemini     → ringkasan / kesimpulan rapat
//
// Karena itu kedua API key WAJIB dikonfigurasi sebelum rapat bisa direkam.
// File ini aman diimpor dari client maupun server (tidak memakai modul Node).
// ---------------------------------------------------------------------------

import type { AiProvider } from "@/lib/types";

// `as const` supaya tipenya tetap literal ("assemblyai"/"gemini"), bukan string.
export const TRANSCRIPTION_PROVIDER = "assemblyai" as const satisfies AiProvider;
export const SUMMARY_PROVIDER = "gemini" as const satisfies AiProvider;

/** Keduanya dipakai bersama, jadi dua-duanya wajib terisi. */
export const REQUIRED_PROVIDERS: AiProvider[] = [TRANSCRIPTION_PROVIDER, SUMMARY_PROVIDER];

export const PROVIDER_LABEL: Record<AiProvider, string> = {
  assemblyai: "AssemblyAI",
  gemini: "Google Gemini",
};

/** Peran singkat untuk badge/keterangan di UI. */
export const PROVIDER_ROLE: Record<AiProvider, string> = {
  assemblyai: "Transkripsi & Pemisahan Pembicara",
  gemini: "Ringkasan & Kesimpulan Rapat",
};

export function missingProviders(
  keys: { provider: AiProvider; isConfigured: boolean }[]
): AiProvider[] {
  return REQUIRED_PROVIDERS.filter(
    (p) => !keys.find((k) => k.provider === p)?.isConfigured
  );
}
