import { NextResponse } from "next/server";

import { getUserByEmail } from "@/lib/db/store";
import { setSessionCookie } from "@/lib/auth/session";
import { RECAPTCHA_SECRET_KEY } from "@/lib/config";

async function verifyRecaptcha(token: string | undefined) {
  if (!token) return false;
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token }),
    });
    const data = (await res.json()) as { success: boolean };
    return Boolean(data.success);
  } catch {
    // Jika Google reCAPTCHA tidak terjangkau (mis. sandbox/offline), jangan
    // blokir login pada demo lokal — pada produksi sebaiknya gagalkan login.
    return process.env.NODE_ENV !== "production";
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const recaptchaToken = typeof body?.recaptchaToken === "string" ? body.recaptchaToken : undefined;

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: "Email dan kata sandi wajib diisi." }, { status: 400 });
  }

  const recaptchaOk = await verifyRecaptcha(recaptchaToken);
  if (!recaptchaOk) {
    return NextResponse.json(
      { ok: false, message: "Verifikasi reCAPTCHA gagal. Silakan coba lagi." },
      { status: 400 }
    );
  }

  const user = await getUserByEmail(email);
  if (!user || user.password !== password) {
    return NextResponse.json({ ok: false, message: "Email atau kata sandi salah." }, { status: 401 });
  }
  if (!user.isActive) {
    return NextResponse.json(
      { ok: false, message: "Akun ini sudah dinonaktifkan. Hubungi superadmin." },
      { status: 403 }
    );
  }

  await setSessionCookie(user.id);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
