import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { deleteUser, getUserByEmail, listUsers, updateUser } from "@/lib/db/store";

type Ctx = { params: Promise<{ id: string }> };

function sanitize<T extends { password: string }>(user: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- sengaja dibuang dari respons API
  const { password: _password, ...rest } = user;
  return rest;
}

export async function PATCH(request: Request, ctx: Ctx) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, message: "Payload tidak valid." }, { status: 400 });

  if (typeof body.email === "string") {
    const existing = await getUserByEmail(body.email);
    if (existing && existing.id !== id) {
      return NextResponse.json({ ok: false, message: "Email sudah digunakan admin lain." }, { status: 409 });
    }
  }
  if (typeof body.password === "string" && !body.password) {
    delete body.password;
  }

  const user = await updateUser(id, body);
  if (!user) return NextResponse.json({ ok: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, user: sanitize(user) });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await ctx.params;
  if (id === sessionUserId) {
    return NextResponse.json({ ok: false, message: "Anda tidak dapat menghapus akun yang sedang digunakan." }, { status: 400 });
  }

  const allUsers = await listUsers();
  const remainingSuperadmins = allUsers.filter((u) => u.role === "superadmin" && u.id !== id);
  const target = allUsers.find((u) => u.id === id);
  if (target?.role === "superadmin" && remainingSuperadmins.length === 0) {
    return NextResponse.json({ ok: false, message: "Minimal harus ada satu akun superadmin." }, { status: 400 });
  }

  const success = await deleteUser(id);
  if (!success) return NextResponse.json({ ok: false, message: "Pengguna tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
