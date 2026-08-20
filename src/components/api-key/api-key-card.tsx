"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PROVIDER_ROLE } from "@/lib/ai/roles";
import { cn } from "@/lib/utils";
import type { ApiKeyConfig } from "@/lib/types";

const PROVIDER_META = {
  assemblyai: {
    docsUrl: "https://www.assemblyai.com/dashboard/signup",
    description:
      "Dipakai saat rekaman selesai: mengubah suara jadi teks sekaligus memisahkan tiap pembicara (speaker diarization).",
    placeholder: "Contoh: 9f8b2c1e4a7d6f0b3c5e8a1d2f4b6c9e",
  },
  gemini: {
    docsUrl: "https://aistudio.google.com/app/apikey",
    description:
      "Dipakai setelah transkrip siap: menyusun ringkasan, poin penting, keputusan, dan tindak lanjut rapat.",
    placeholder: "Contoh: AIzaSyD-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  },
} as const;

export function ApiKeyCard({ config, onChanged, index = 0 }: { config: ApiKeyConfig; onChanged: () => void; index?: number }) {
  const meta = PROVIDER_META[config.provider];
  const [value, setValue] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  async function handleSave() {
    const apiKey = value.trim();
    if (!apiKey) {
      toast.error("Masukkan API key terlebih dahulu.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: config.provider, apiKey }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Gagal menyimpan API key.");
      toast.success(`API key ${config.label} disimpan`);
      setValue("");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan API key.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/api-keys/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: config.provider }),
      });
      const data = await res.json();
      if (data.ok) toast.success("Koneksi berhasil");
      else toast.error("Koneksi gagal. Periksa kembali API key Anda.");
      onChanged();
    } catch {
      toast.error("Gagal menguji koneksi.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <Card className={cn("relative overflow-hidden", !config.isConfigured && "ring-2 ring-destructive/30")}>
        <div className="absolute top-4 right-4">
          <Badge variant={config.isConfigured ? "brand" : "outline"}>
            <ShieldCheck className="size-3" />
            Wajib
          </Badge>
        </div>
        <CardHeader>
          <CardTitle>{config.label}</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">{PROVIDER_ROLE[config.provider]}</span> — {meta.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            {config.isConfigured ? (
              <Badge variant="secondary">Tersimpan: {config.apiKey}</Badge>
            ) : (
              <Badge variant="outline">Belum dikonfigurasi</Badge>
            )}
            {config.lastTestStatus === "berhasil" && (
              <span className="inline-flex items-center gap-1 text-xs text-success">
                <CheckCircle2 className="size-3.5" />
                Terhubung
              </span>
            )}
            {config.lastTestStatus === "gagal" && (
              <span className="inline-flex items-center gap-1 text-xs text-destructive">
                <XCircle className="size-3.5" />
                Gagal terhubung
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`key-${config.provider}`}>
              {config.isConfigured ? "Ganti API Key" : "Masukkan API Key"}
            </Label>
            <div className="relative">
              <Input
                id={`key-${config.provider}`}
                type={show ? "text" : "password"}
                placeholder={meta.placeholder}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pr-9 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || !value.trim()}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Simpan
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTest}
              disabled={testing || !config.isConfigured}
            >
              {testing && <Loader2 className="size-4 animate-spin" />}
              Uji Koneksi
            </Button>
          </div>

          <a
            href={meta.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Dapatkan API key <ExternalLink className="size-3" />
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}
