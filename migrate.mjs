/**
 * 2026건전한예약현황 엑셀 → reservations 테이블 마이그레이션 스크립트
 *
 * encrypt()/hashPhone() 은 lib/encryption.ts 와 동일한 알고리즘(AES-256-GCM,
 * base64(iv(12)||tag(16)||ciphertext), SHA-256 phone hash)으로 이식되어 있습니다.
 * → ENCRYPTION_KEY 환경변수만 실제 서비스와 같은 값이면 관리자 페이지에서 정상 복호화됩니다.
 *
 * 실행 전 준비:
 * 1) .env 에 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ENCRYPTION_KEY 가 있어야 합니다
 *    (service_role 키 필요 — RLS 우회. ENCRYPTION_KEY는 실서비스와 동일한 값 사용).
 * 2) reservations_parsed.json 을 이 파일과 같은 폴더에 둡니다.
 * 3) @supabase/supabase-js 설치: npm install @supabase/supabase-js
 *
 * 실행 (Node 20.6+, .env 자동 로드):
 *   node --env-file=.env migrate.mjs --dry-run   # 먼저 콘솔로만 확인
 *   node --env-file=.env migrate.mjs             # 실제 insert
 *
 * dotenv 패키지를 쓴다면 상단에 `import 'dotenv/config';` 한 줄 추가 후 그냥 `node migrate.mjs`.
 */

import fs from 'fs';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import WS from 'ws';
import { createClient } from '@supabase/supabase-js';

// Node 20 이하엔 전역 WebSocket이 없어서 supabase-js가 client 생성 시점에
// realtime 모듈 초기화하다 죽는 문제 방지용 폴리필 (실제 realtime 기능은 안 씀).
if (!globalThis.WebSocket) {
  globalThis.WebSocket = WS;
}

// lib/encryption.ts 와 동일한 로직 (AES-256-GCM, base64(iv(12)||tag(16)||ciphertext))
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;

function getKey() {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error('ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY 는 32바이트(Base64) 여야 합니다. 현재 ${key.length}바이트.`);
  }
  return key;
}

function encrypt(plaintext) {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

function hashPhone(phone) {
  const norm = phone.replace(/\D+/g, '');
  return createHash('sha256').update(norm).digest('hex');
}

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const data = JSON.parse(fs.readFileSync('./reservations_parsed.json', 'utf-8'));

let ok = 0, fail = 0;

for (const r of data) {
  const reservationRow = {
    packages: r.packages,
    package_label: r.package_label,
    season: r.season,
    guests_count: r.guests_count,
    check_in: r.check_in,
    check_out: r.check_out,
    total_price: r.total_price,
    status: r.status,           // 'confirmed'
    room_key: r.room_key,        // null 가능
    source: r.source,            // 'manual'
    created_by_admin: 'excel_import',
    memo: r.memo,
  };

  if (DRY_RUN) {
    console.log('[DRY-RUN] reservation:', reservationRow, '| guest:', r.guest_name, r.guest_phone);
    ok++;
    continue;
  }

  try {
    const { data: inserted, error } = await supabase
      .from('reservations')
      .insert(reservationRow)
      .select()
      .single();

    if (error) throw error;

    const reservationId = inserted.id;

    // 대표자 게스트 1명 등록 (이름 필수, 전화번호는 있으면 암호화+해시)
    const guestRow = {
      reservation_id: reservationId,
      name_enc: encrypt(r.guest_name || '이름미상'),
      phone_enc: r.guest_phone ? encrypt(String(r.guest_phone)) : null,
      phone_hash: r.guest_phone ? hashPhone(String(r.guest_phone)) : null,
      is_representative: true,
    };

    const { error: guestErr } = await supabase.from('reservation_guests').insert(guestRow);
    if (guestErr) throw guestErr;

    // 이력 기록
    await supabase.from('reservation_history').insert({
      reservation_id: reservationId,
      admin_username: 'system',
      admin_display_name: '엑셀 이력 일괄 등록',
      action: 'admin_created',
      after_status: 'confirmed',
    });

    ok++;
  } catch (e) {
    fail++;
    console.error(`행 ${r.row} 실패:`, e.message || e);
  }
}

console.log(`완료: 성공 ${ok}건, 실패 ${fail}건 (총 ${data.length}건)`);
