import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "adm_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 시간

export type AdminRole = "admin" | "viewer";

// 파싱 후 hash 는 항상 Uint8Array (원본 평문/해시 문자열은 폐기).
type AdminRecord = {
  username: string;
  displayName: string;
  role: AdminRole;
  salt: string;
  hash: Uint8Array;
};

function parseRole(raw: string): AdminRole {
  const v = raw.trim().toLowerCase();
  if (v === "admin") return "admin";
  if (v === "viewer") return "viewer";
  throw new Error(
    `ADMIN_USERS 역할 값이 올바르지 않습니다: "${raw}" · "admin" 또는 "viewer" 여야 합니다.`,
  );
}

function toU8(buf: Buffer): Uint8Array {
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

// 한글이 포함된 값은 NFC(완성형) 로 정규화한 뒤 해시/비교해야 함.
// macOS 파일시스템 · 일부 편집기가 NFD(조합형) 로 저장하면 IME 로 입력한 NFC 와 바이트가 달라
// 동일해 보이는 문자열임에도 scrypt 결과가 달라져 로그인이 실패한다.
function nfc(s: string): string {
  return s.normalize("NFC");
}

// ADMIN_USERS 파싱 결과를 프로세스 수명 동안 캐시.
// 최초 접근 시 각 관리자마다 scrypt 로 해싱 → 이후 요청은 캐시된 해시만 비교.
// 형식 : "아이디:비번|이름|역할" 을 콤마로 구분
//   역할 = "admin" (변경 권한) | "viewer" (조회 권한)
//   예: "hyoseon:pass1|임효선|admin,staff1:pass2|박스태프|viewer"
let cachedAdmins: AdminRecord[] | null = null;

function parseAdminUsers(): AdminRecord[] {
  if (cachedAdmins) return cachedAdmins;
  const raw = process.env.ADMIN_USERS ?? "";
  const entries = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed: AdminRecord[] = entries.map((entry) => {
    const parts = entry.split("|");
    if (parts.length !== 3) {
      throw new Error(
        `ADMIN_USERS 항목 형식 오류: "${entry}" · "아이디:비번|이름|역할" 형태여야 합니다.`,
      );
    }
    const [idPass, nameRaw, roleRaw] = parts;
    const colonIdx = idPass.indexOf(":");
    if (colonIdx < 0) {
      throw new Error(
        `ADMIN_USERS 항목 형식 오류: "${entry}" · 아이디와 비밀번호는 ":" 로 구분해주세요.`,
      );
    }
    const username = nfc(idPass.slice(0, colonIdx).trim());
    const password = nfc(idPass.slice(colonIdx + 1));
    const displayName = nfc(nameRaw.trim());
    if (!username || !password || !displayName) {
      throw new Error(
        `ADMIN_USERS 항목 형식 오류: "${entry}" · 아이디·비밀번호·이름을 모두 채워주세요.`,
      );
    }
    const role = parseRole(roleRaw);
    const salt = randomBytes(16).toString("hex");
    const hash = toU8(scryptSync(password, "__" + salt, 64));
    return { username, displayName, role, salt, hash };
  });

  const seen = new Set<string>();
  for (const a of parsed) {
    if (seen.has(a.username)) {
      throw new Error(`ADMIN_USERS 에 중복된 아이디: "${a.username}"`);
    }
    seen.add(a.username);
  }

  cachedAdmins = parsed;
  return parsed;
}

export function verifyAdminCredentials(
  username: string,
  password: string,
):
  | { ok: true; username: string; displayName: string; role: AdminRole }
  | { ok: false } {
  const admins = parseAdminUsers();
  const normUsername = nfc(username);
  const normPassword = nfc(password);
  const record = admins.find((a) => a.username === normUsername);
  if (!record) return { ok: false };
  const actual = toU8(scryptSync(normPassword, "__" + record.salt, 64));
  if (record.hash.length !== actual.length) return { ok: false };
  return timingSafeEqual(record.hash, actual)
    ? {
        ok: true,
        username: record.username,
        displayName: record.displayName,
        role: record.role,
      }
    : { ok: false };
}

// 로그인 식별자로부터 현재 .env 의 표시명/역할 조회 (액션 발생 시 이력 스냅샷용).
export function getAdminProfile(
  username: string,
): { displayName: string; role: AdminRole } | null {
  const normalized = nfc(username);
  const record = parseAdminUsers().find((a) => a.username === normalized);
  return record ? { displayName: record.displayName, role: record.role } : null;
}

function getSessionSecret(): Uint8Array {
  const raw = process.env.SESSION_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("SESSION_SECRET 이 설정되지 않았거나 너무 짧습니다.");
  }
  return toU8(Buffer.from(raw, "utf8"));
}

type SessionPayload = { u: string; e: number };

function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = 4 - (s.length % 4);
  const padded = s + (pad < 4 ? "=".repeat(pad) : "");
  return toU8(Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64"));
}

export function signSession(username: string): string {
  const payload: SessionPayload = { u: username, e: Date.now() + SESSION_TTL_MS };
  const bodyBytes = toU8(Buffer.from(JSON.stringify(payload), "utf8"));
  const body = b64url(bodyBytes);
  const sig = b64url(toU8(createHmac("sha256", getSessionSecret()).update(body).digest()));
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined): { username: string } | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64url(toU8(createHmac("sha256", getSessionSecret()).update(body).digest()));
  const a = toU8(Buffer.from(sig, "utf8"));
  const b = toU8(Buffer.from(expected, "utf8"));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64urlDecode(body)).toString("utf8")) as SessionPayload;
    if (typeof payload.u !== "string" || typeof payload.e !== "number") return null;
    if (payload.e < Date.now()) return null;
    return { username: payload.u };
  } catch {
    return null;
  }
}

export type CurrentAdmin = { username: string; displayName: string; role: AdminRole };

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = verifySession(token);
  if (!session) return null;
  const profile = getAdminProfile(session.username);
  // 세션 발급 후 .env 에서 해당 관리자가 삭제된 경우 로그아웃 취급
  if (!profile) return null;
  return { username: session.username, ...profile };
}

export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Response("Unauthorized", { status: 401 });
  return admin;
}
