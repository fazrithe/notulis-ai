"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, TriangleAlert } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { ApiKeyCard } from "@/components/api-key/api-key-card";
import { PROVIDER_LABEL, missingProviders } from "@/lib/ai/roles";
import type { ApiKeyConfig } from "@/lib/types";

export function ApiKeyBoard({ apiKeys }: { apiKeys: ApiKeyConfig[] }) {
  const router = useRouter();
  const missing = missingProviders(apiKeys);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">API Key</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Notulis AI memakai kedua penyedia AI sekaligus — keduanya wajib diisi.
        </p>
      </div>

      <Card className="border-dashed bg-primary/5">
        <CardContent className="flex items-start gap-3 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-4.5" />
          </span>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">AssemblyAI</span> menangani transkripsi suara ke teks sekaligus
            memisahkan pembicara (speaker diarization), lalu{" "}
            <span className="font-medium text-foreground">Google Gemini</span> mengubah transkrip itu menjadi ringkasan,
            keputusan, dan tindak lanjut rapat. Karena dipakai bersama, rekaman baru bisa dimulai setelah kedua API key
            tersimpan.
          </p>
        </CardContent>
      </Card>

      {missing.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-destructive" />
            <span>
              <span className="font-medium text-foreground">
                Belum lengkap: {missing.map((p) => PROVIDER_LABEL[p]).join(" & ")}.
              </span>{" "}
              Simpan API key yang kurang di bawah ini untuk mulai merekam rapat.
            </span>
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success/5 p-4 text-sm">
          <CheckCircle2 className="size-4.5 shrink-0 text-success" />
          <span>
            Kedua API key sudah tersimpan.{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => router.push("/agenda")}
            >
              Buat notulis baru
            </button>{" "}
            untuk mulai merekam.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {apiKeys.map((config, i) => (
          <ApiKeyCard key={config.provider} config={config} index={i} onChanged={() => router.refresh()} />
        ))}
      </div>
    </div>
  );
}
