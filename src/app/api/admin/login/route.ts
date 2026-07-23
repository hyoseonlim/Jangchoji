import { NextResponse } from "next/server";
import { SESSION_COOKIE, signSession, verifyAdminCredentials } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const username = typeof b.username === "string" ? b.username : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (!username || !password) {
    return NextResponse.json({ error: "아이디와 비밀번호를 입력해주세요." }, { status: 400 });
  }
  const result = verifyAdminCredentials(username, password);
  if (!result.ok) {
    return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  const token = signSession(result.username);
  const res = NextResponse.json({ ok: true, username: result.username });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
