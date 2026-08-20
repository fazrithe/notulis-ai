"use client";

import * as React from "react";
import { Loader2, MapPin, Mic, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROVIDER_LABEL } from "@/lib/ai/roles";
import type { Meeting } from "@/lib/types";

export function CreateMeetingDialog({
  open,
  onOpenChange,
  defaultDate,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  onCreated: (meeting: Meeting) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(defaultDate);
  const [location, setLocation] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Reset form fields whenever the dialog is (re)opened.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDate(defaultDate);
      setLocation("");
    }
  }, [open, defaultDate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul rapat wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, location }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Gagal membuat notulis baru.");
      onOpenChange(false);
      onCreated(data.meeting);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat notulis baru.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Notulis Baru</DialogTitle>
          <DialogDescription>
            Isi judul rapat, lalu klik &ldquo;Mulai&rdquo; untuk mulai merekam secara otomatis.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Judul Rapat</Label>
            <Input
              id="title"
              autoFocus
              placeholder="Contoh: Rapat Koordinasi Tim Produk"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Tanggal</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Lokasi (opsional)</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="Ruang rapat / tautan"
                  className="pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p>
              Rapat ini akan ditranskrip &amp; dipisah per pembicara oleh{" "}
              <span className="font-medium text-foreground">{PROVIDER_LABEL.assemblyai}</span>, lalu diringkas oleh{" "}
              <span className="font-medium text-foreground">{PROVIDER_LABEL.gemini}</span>.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
              Lanjut &amp; Mulai Rekam
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
