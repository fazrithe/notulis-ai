import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { deleteMeeting, getMeeting, updateMeeting } from "@/lib/db/store";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await ctx.params;
  const meeting = await getMeeting(id);
  if (!meeting) return NextResponse.json({ ok: false, message: "Rapat tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, meeting });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await ctx.params;
  const patch = await request.json().catch(() => null);
  if (!patch) return NextResponse.json({ ok: false, message: "Payload tidak valid." }, { status: 400 });

  const meeting = await updateMeeting(id, patch);
  if (!meeting) return NextResponse.json({ ok: false, message: "Rapat tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true, meeting });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await ctx.params;
  const success = await deleteMeeting(id);
  if (!success) return NextResponse.json({ ok: false, message: "Rapat tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
