import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// ---------------------------------------------------------------------------
// Sesi login sederhana berbasis cookie ber-signature HMAC.
//
// Ini BUKAN pengganti solusi auth produksi (mis. NextAuth/Auth.js, atau
// session store di database) — dibuat ringan supaya scaffold ini mudah
// dibaca & dijalankan tanpa dependency tambahan. Untuk produksi, ganti
// dengan session store di database + rotasi token yang lebih ketat.
// ---------------------------------------------------------------------------

export const SESSION_COOKIE = "notulis_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 8; // 8 jam

function getSecret() {
  return process.env.SESSION_SECRET || "notulis-ai-dev-secret-ganti-di-produksi";
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string) {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + SESSION_MAX_AGE_SEC * 1000 });
  const encoded = Buffer.from(payload, "utf-8").toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")) as {
      uid: string;
      exp: number;
    };
    if (Date.now() > payload.exp) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
