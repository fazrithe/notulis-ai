import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/auth/session";
import { createMeeting, listMeetings } from "@/lib/db/store";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const all = await listMeetings();
  const meetings = date ? all.filter((m) => m.date === date) : all;
  return NextResponse.json({ ok: true, meetings });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const date = typeof body?.date === "string" ? body.date : "";
  const location = typeof body?.location === "string" ? body.location : undefined;

  if (!title || !date) {
    return NextResponse.json({ ok: false, message: "Judul dan tanggal rapat wajib diisi." }, { status: 400 });
  }

  const meeting = await createMeeting({ title, date, location, createdBy: userId });
  return NextResponse.json({ ok: true, meeting }, { status: 201 });
}
