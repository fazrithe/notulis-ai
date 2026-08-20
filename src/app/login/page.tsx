"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AudioLines,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Recaptcha } from "@/components/recaptcha";
import { cn } from "@/lib/utils";

const DEMO_EMAIL = "admin@notulis.com";
const DEMO_PASSWORD = "Notul!s&888";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [recaptchaToken, setRecaptchaToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!recaptchaToken) {
      setError("Mohon selesaikan verifikasi reCAPTCHA terlebih dahulu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.message || "Gagal masuk. Periksa kembali data Anda.");
        setLoading(false);
        return;
      }
      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setLoading(false);
    }
  }

  function fillDemoCredentials() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Panel brand */}
      <div className="relative hidden overflow-hidden bg-brand-gradient lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-black/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-2.5 text-white"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <AudioLines className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Notulis AI</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10 max-w-md text-white"
        >
          <div className="mb-6 flex items-center gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span
                key={i}
                className="w-1.5 origin-bottom animate-wave rounded-full bg-white/70"
                style={{
                  height: `${16 + (i % 4) * 10}px`,
                  animationDelay: `${i * 0.09}s`,
                }}
              />
            ))}
          </div>
          <h1 className="text-3xl leading-tight font-bold text-balance">
            Rekam rapat, dapat kesimpulannya, tanpa perlu ada yang jadi sekretaris.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Notulis AI merekam rapat secara otomatis, memisahkan suara tiap peserta
            dengan label Bapak/Ibu, lalu membuat notulen dan kesimpulan rapat
            secara instan menggunakan AssemblyAI dan Gemini.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { icon: AudioLines, label: "Rekam otomatis" },
              { icon: Sparkles, label: "Ringkasan instan" },
              { icon: ShieldCheck, label: "Login aman" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-xl border border-white/15 bg-white/10 p-3 text-xs font-medium backdrop-blur-sm"
              >
                <f.icon className="mb-2 size-4" />
                {f.label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 text-xs text-white/60"
        >
          © 2026 Notulis AI — dikembangkan di bawah Pionir AI.
        </motion.p>
      </div>

      {/* Panel form */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
              <AudioLines className="size-4.5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Notulis AI</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Masuk ke akun Anda</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Kelola rapat, transkrip, dan notulen Anda di satu tempat.
          </p>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3.5 text-xs text-muted-foreground">
            <Wand2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p>
                Akun contoh: <span className="font-mono font-medium text-foreground">{DEMO_EMAIL}</span> /{" "}
                <span className="font-mono font-medium text-foreground">{DEMO_PASSWORD}</span>
              </p>
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Isi otomatis
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nama@notulis.com"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Kata Sandi</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••"
                  className="px-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="pt-1">
              <Recaptcha onVerify={setRecaptchaToken} />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {loading ? "Memverifikasi..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Dilindungi reCAPTCHA. Kunci uji digunakan secara default untuk demo —
            ganti dengan kunci produksi Anda di halaman Cara Pemakaian.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className={cn("min-h-screen bg-background")} />}>
      <LoginContent />
    </React.Suspense>
  );
}
