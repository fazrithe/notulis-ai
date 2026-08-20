"use client";

import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PROVIDER_LABEL, PROVIDER_ROLE } from "@/lib/ai/roles";
import type { AiProvider } from "@/lib/types";

/**
 * Peringatan yang muncul saat user hendak merekam padahal API key belum
 * lengkap. Tombol utamanya mengarahkan langsung ke menu API Key.
 */
export function ApiKeyRequiredDialog({
  missing,
  onOpenChange,
}: {
  missing: AiProvider[] | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  return (
    <AlertDialog open={Boolean(missing?.length)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <span className="mb-1 flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <KeyRound className="size-5" />
          </span>
          <AlertDialogTitle>API Key belum lengkap</AlertDialogTitle>
          <AlertDialogDescription>
            Notulis AI memakai dua layanan sekaligus: AssemblyAI untuk transkripsi &amp; pemisahan pembicara, dan Google
            Gemini untuk kesimpulan rapat. Rekaman baru bisa dimulai setelah keduanya dikonfigurasi.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="space-y-2">
          {(missing ?? []).map((provider) => (
            <li
              key={provider}
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
              <span>
                <span className="font-medium">{PROVIDER_LABEL[provider]}</span> belum diisi —{" "}
                <span className="text-muted-foreground">{PROVIDER_ROLE[provider]}</span>
              </span>
            </li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogCancel>Nanti Saja</AlertDialogCancel>
          <AlertDialogAction onClick={() => router.push("/api-key")}>
            <KeyRound className="size-4" />
            Buka Menu API Key
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
