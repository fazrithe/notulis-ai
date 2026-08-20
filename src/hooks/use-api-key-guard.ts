"use client";

import * as React from "react";
import { toast } from "sonner";

import { missingProviders } from "@/lib/ai/roles";
import type { AiProvider } from "@/lib/types";

/**
 * Penjaga sebelum merekam: memastikan API key AssemblyAI (transkripsi) DAN
 * Gemini (ringkasan) dua-duanya sudah dikonfigurasi.
 *
 * Statusnya sengaja diambil langsung dari server saat aksi dilakukan, bukan
 * dari props halaman, supaya tidak basi setelah user baru saja menyimpan key
 * di tab lain.
 */
export function useApiKeyGuard() {
  const [missing, setMissing] = React.useState<AiProvider[] | null>(null);
  const [checking, setChecking] = React.useState(false);

  const ensureApiKeysReady = React.useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/api-keys");
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error("Gagal membaca status API key.");

      const lacking: AiProvider[] = Array.isArray(data.missing)
        ? data.missing
        : missingProviders(data.apiKeys ?? []);

      if (lacking.length) {
        setMissing(lacking);
        return false;
      }
      return true;
    } catch {
      // Status tidak bisa dipastikan — jangan lanjut merekam, tapi juga jangan
      // menuduh key-nya kosong.
      toast.error("Gagal memeriksa status API key. Periksa koneksi Anda lalu coba lagi.");
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  const dismissMissing = React.useCallback(() => setMissing(null), []);

  /** Memunculkan peringatan yang sama dari respons API `code: "missing_api_key"`. */
  const reportMissing = React.useCallback((providers: unknown) => {
    if (!Array.isArray(providers) || providers.length === 0) return false;
    setMissing(providers as AiProvider[]);
    return true;
  }, []);

  return { missing, checking, ensureApiKeysReady, dismissMissing, reportMissing };
}
