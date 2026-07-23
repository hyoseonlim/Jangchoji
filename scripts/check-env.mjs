#!/usr/bin/env node
// .env.local 에 들어있는 Supabase 키의 role 을 안전하게 확인.
// 사용법: node scripts/check-env.mjs

import { readFileSync } from "node:fs";

let raw;
try {
  raw = readFileSync(".env.local", "utf8");
} catch {
  console.error("❌ .env.local 을 찾을 수 없습니다. 프로젝트 루트에서 실행하세요.");
  process.exit(1);
}

const env = raw.split("\n").reduce((acc, line) => {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) acc[m[1]] = m[2].trim();
  return acc;
}, {});

function inspect(name) {
  const v = env[name];
  if (!v) return console.log(`❌ ${name}: 값 없음`);
  const parts = v.split(".");
  if (parts.length !== 3) return console.log(`❌ ${name}: JWT 형식 아님`);
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    console.log(`✅ ${name}`);
    console.log(`   role : ${payload.role}`);
    console.log(`   ref  : ${payload.ref}`);
    console.log(`   iss  : ${payload.iss}`);
  } catch {
    console.log(`❌ ${name}: 디코딩 실패`);
  }
}

console.log(`URL     : ${env.NEXT_PUBLIC_SUPABASE_URL || "(비어있음)"}`);
console.log();
inspect("NEXT_PUBLIC_SUPABASE_ANON_KEY");
console.log();
inspect("SUPABASE_SERVICE_ROLE_KEY");
console.log();

const anonRef = decodeRef(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const svcRef = decodeRef(env.SUPABASE_SERVICE_ROLE_KEY);
const urlRef = (env.NEXT_PUBLIC_SUPABASE_URL || "").match(/\/\/([^.]+)\./)?.[1];

console.log("─── 요약 진단 ───");
if (anonRef && anonRef !== "anon") console.log("⚠️  ANON 자리에 anon 이 아닌 키가 있습니다.");
if (svcRef && svcRef !== "service_role") {
  console.log("⚠️  SERVICE_ROLE_KEY 자리에 service_role 이 아닌 키가 있습니다 → 지금 나오는 permission denied 에러의 원인.");
}
const anonProjectRef = decodeProjectRef(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const svcProjectRef = decodeProjectRef(env.SUPABASE_SERVICE_ROLE_KEY);
if (urlRef && anonProjectRef && urlRef !== anonProjectRef) {
  console.log("⚠️  URL 프로젝트와 ANON 키 프로젝트가 다릅니다.");
}
if (urlRef && svcProjectRef && urlRef !== svcProjectRef) {
  console.log("⚠️  URL 프로젝트와 SERVICE_ROLE 키 프로젝트가 다릅니다.");
}
if (
  svcRef === "service_role" &&
  anonRef === "anon" &&
  urlRef &&
  urlRef === anonProjectRef &&
  urlRef === svcProjectRef
) {
  console.log("✅ 키·URL 조합 정상. permission denied 가 이어지면 dev 서버 재시작 여부·SQL 실행 여부를 확인하세요.");
}

function decodeRef(jwt) {
  if (!jwt) return null;
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64").toString("utf8")).role;
  } catch {
    return null;
  }
}

function decodeProjectRef(jwt) {
  if (!jwt) return null;
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64").toString("utf8")).ref;
  } catch {
    return null;
  }
}
