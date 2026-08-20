"use client";

import * as React from "react";
import { Loader2, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminRole, AdminUser } from "@/lib/types";

type SafeUser = Omit<AdminUser, "password">;

export function UserFormDialog({
  user,
  open,
  onOpenChange,
  onSaved,
}: {
  user: SafeUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(user);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<AdminRole>("admin");
  const [isActive, setIsActive] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  // Reset form fields whenever the dialog is (re)opened for a (different) user.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setPassword("");
      setRole(user?.role ?? "admin");
      setIsActive(user?.isActive ?? true);
    }
  }, [open, user]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit && user) {
        const res = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, role, isActive, ...(password ? { password } : {}) }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || "Gagal menyimpan perubahan.");
        toast.success("Data admin berhasil diperbarui");
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || "Gagal menambah admin.");
        toast.success("Admin baru berhasil ditambahkan");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Admin" : "Tambah Admin Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Perbarui data pengguna admin." : "Buat akun admin baru untuk mengelola Notulis AI."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{isEdit ? "Kata Sandi Baru (opsional)" : "Kata Sandi"}</Label>
            <Input
              id="password"
              type="password"
              required={!isEdit}
              placeholder={isEdit ? "Kosongkan jika tidak diubah" : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Peran</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AdminRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status Aktif</Label>
              <div className="flex h-10 items-center gap-2.5">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm text-muted-foreground">{isActive ? "Aktif" : "Nonaktif"}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" variant="brand" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEdit ? (
                <Save className="size-4" />
              ) : (
                <UserPlus className="size-4" />
              )}
              {isEdit ? "Simpan Perubahan" : "Tambah Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
