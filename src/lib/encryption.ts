import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

let cachedKey: Uint8Array | null = null;

function toU8(buf: Buffer): Uint8Array {
  // Buffer 는 런타임엔 Uint8Array 이지만 TS 타입은 별개라 명시 변환.
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

function getKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.");
  const key = toU8(Buffer.from(raw, "base64"));
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY 는 32바이트(Base64) 여야 합니다. 현재 ${key.length}바이트.`,
    );
  }
  cachedKey = key;
  return key;
}

function concatU8(...parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

// AES-256-GCM 암호화. 반환 포맷: Base64( iv(12) || tag(16) || ciphertext )
export function encrypt(plaintext: string): string {
  const iv = toU8(randomBytes(IV_LEN));
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ct = concatU8(toU8(cipher.update(plaintext, "utf8")), toU8(cipher.final()));
  const tag = toU8(cipher.getAuthTag());
  return Buffer.from(concatU8(iv, tag, ct)).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = toU8(Buffer.from(payload, "base64"));
  if (buf.length < IV_LEN + TAG_LEN + 1) throw new Error("암호문 길이 오류");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ct = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const out = concatU8(toU8(decipher.update(ct)), toU8(decipher.final()));
  return Buffer.from(out).toString("utf8");
}

// 전화번호 정규화 후 SHA-256. 하이픈/공백 제거 → 숫자만 남김.
export function hashPhone(phone: string): string {
  const norm = phone.replace(/\D+/g, "");
  return createHash("sha256").update(norm).digest("hex");
}

export function maskPhone(phone: string): string {
  const norm = phone.replace(/\D+/g, "");
  if (norm.length < 7) return phone;
  const head = norm.slice(0, 3);
  const tail = norm.slice(-4);
  return `${head}-****-${tail}`;
}

export function maskName(name: string): string {
  if (name.length <= 1) return name;
  return name[0] + "*".repeat(name.length - 1);
}
