import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { createUser, getUserByEmail, listUsers } from "@/lib/db/store";

function sanitize<T extends { password: string }>(user: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- sengaja dibuang dari respons API
  const { password: _password, ...rest } = user;
  return rest;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const users = (await listUsers()).map(sanitize);
  return NextResponse.json({ ok: true, users });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role === "superadmin" ? "superadmin" : "admin";

  if (!name || !email || !password) {
    return NextResponse.json({ ok: false, message: "Nama, email, dan kata sandi wajib diisi." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ ok: false, message: "Kata sandi minimal 6 karakter." }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ ok: false, message: "Email sudah digunakan admin lain." }, { status: 409 });
  }

  const user = await createUser({ name, email, password, role, isActive: true, avatarUrl: null });
  return NextResponse.json({ ok: true, user: sanitize(user) }, { status: 201 });
}
