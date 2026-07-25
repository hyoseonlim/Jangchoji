-- 예약 시스템 초기 스키마 + 시드 (최종본, 한 번만 실행)
-- 실행 방법: Supabase Dashboard > SQL Editor 에 이 파일 내용 전체를 붙여넣고 Run
-- 재실행 안전: 스키마 CREATE 는 최초 1회만 정상 동작. 재실행 시 "already exists" 오류가 나면
--             각 CREATE 문 앞에 DROP 을 넣어 초기화하거나, seed 섹션(TRUNCATE ... INSERT)만 별도로 실행하세요.
--
-- 관리자(admins) 테이블은 5명 이내 소규모 운영이므로 .env(ADMIN_USERS) 로 관리 (테이블 없음).
--
-- ─────────────────────────────────────────────────────────────────
-- 기존 DB 를 이미 만드셨다면(재생성하지 않을 경우), 아래 ALTER 만 실행하면 관리자 편집 기능이 활성화됩니다.
-- ─────────────────────────────────────────────────────────────────
-- ALTER TABLE reservations
--   ADD COLUMN IF NOT EXISTS source             TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online','manual')),
--   ADD COLUMN IF NOT EXISTS created_by_admin   TEXT,
--   ADD COLUMN IF NOT EXISTS price_override     INTEGER CHECK (price_override IS NULL OR price_override >= 0),
--   ADD COLUMN IF NOT EXISTS price_note         TEXT,
--   ADD COLUMN IF NOT EXISTS last_edited_at     TIMESTAMPTZ,
--   ADD COLUMN IF NOT EXISTS last_edited_by     TEXT;
-- ALTER TABLE reservation_history
--   ADD COLUMN IF NOT EXISTS changes            JSONB;
--
-- ▶ 물리 객실 확장 (4/5/6인실 A/B 각 2개, 8인실 1개 = 총 7개)
-- ★ 반드시 DROP → UPDATE → ADD 순서로 실행 (기존 CHECK 가 새 값 'room_4_a' 를 거부하므로).
-- 1) 옛 CHECK 제약 먼저 제거
-- ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_room_key_check;
-- 2) 데이터 마이그레이션 : room_4 → room_4_a 등
-- UPDATE reservations SET room_key = 'room_4_a' WHERE room_key = 'room_4';
-- UPDATE reservations SET room_key = 'room_5_a' WHERE room_key = 'room_5';
-- UPDATE reservations SET room_key = 'room_6_a' WHERE room_key = 'room_6';
-- 3) 새 CHECK 제약 추가
-- ALTER TABLE reservations
--   ADD CONSTRAINT reservations_room_key_check
--   CHECK (room_key IS NULL OR room_key IN ('room_4_a','room_4_b','room_5_a','room_5_b','room_6_a','room_6_b','room_8'));

BEGIN;

------------------------------------------------------------
-- 확장 : btree_gist (reservations 의 room_key + daterange 이중예약 방지 EXCLUDE 제약에 필요)
------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS btree_gist;

------------------------------------------------------------
-- ENUM 타입
------------------------------------------------------------
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');

------------------------------------------------------------
-- products : 성수기/비수기 × 4인/2-3인 × 평일/토요일 × 10 config = 80행
------------------------------------------------------------
CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  season       TEXT NOT NULL CHECK (season IN ('peak','off')),
  group_size   TEXT NOT NULL CHECK (group_size IN ('4','3','2')),
  day_type     TEXT NOT NULL CHECK (day_type IN ('weekday','saturday')),
  config_key   TEXT NOT NULL,
  name         TEXT NOT NULL,
  has_bbq      BOOLEAN NOT NULL DEFAULT false,
  price        INTEGER NOT NULL CHECK (price >= 0),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season, group_size, day_type, config_key)
);

CREATE INDEX idx_products_filter ON products (season, group_size, day_type) WHERE is_active;

------------------------------------------------------------
-- reservations
--   packages : 인원별로 각자 선택한 패키지 목록 (JSONB). 형태:
--     [
--       { "configKey": "rides3", "label": "숙박 + 놀이기구 3종",
--         "quantity": 3, "perPersonSubtotal": 165000, "lineTotal": 495000 },
--       { "configKey": "rides5", "label": "...", "quantity": 2, "perPersonSubtotal": 207000, "lineTotal": 414000 }
--     ]
--     Σ quantity == guests_count · Σ lineTotal == total_price (앱 레벨 보장).
--   package_label : 관리자 목록 표시용 요약 문자열 ("3종×3, 5종×2").
--   depositor_name_enc : 입금자명 (대표자와 다를 수 있음). AES-256-GCM 암호화.
--   room_key : 예약된 객실 (4/5/6/8인실). 물리 객실 1개씩만 존재하므로
--              동일 room_key + 날짜 범위 겹침 예약은 EXCLUDE 제약으로 차단.
------------------------------------------------------------
CREATE TABLE reservations (
  id                 SERIAL PRIMARY KEY,
  packages           JSONB NOT NULL,
  package_label      TEXT NOT NULL,
  season             TEXT NOT NULL CHECK (season IN ('peak','off','mixed')),
  group_size         TEXT NOT NULL CHECK (group_size IN ('4','3','2')),
  guests_count       INTEGER NOT NULL CHECK (guests_count > 0),
  check_in           DATE NOT NULL,
  check_out          DATE NOT NULL,
  total_price        INTEGER NOT NULL CHECK (total_price >= 0),
  status             reservation_status NOT NULL DEFAULT 'pending',
  memo               TEXT,
  depositor_name_enc TEXT,
  -- 물리 객실 : 4/5/6인실 각 A/B 2개씩, 8인실 1개 = 총 7개
  room_key           TEXT CHECK (room_key IS NULL OR room_key IN ('room_4_a','room_4_b','room_5_a','room_5_b','room_6_a','room_6_b','room_8')),
  -- 예약 출처 : online = 웹 예약 폼, manual = 관리자 수기 등록
  source             TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online','manual')),
  created_by_admin   TEXT, -- 수기 등록한 관리자 아이디 (source='manual' 인 경우)
  -- 금액 오버라이드 : 계산가와 다른 금액을 최종가로 사용해야 할 때 (할인/특별가/협의금액 등)
  --   설정 시 total_price 는 이 값을 저장하고, UI 에서 재계산해 비교 표시
  price_override     INTEGER CHECK (price_override IS NULL OR price_override >= 0),
  price_note         TEXT, -- 오버라이드 사유 (감사)
  last_edited_at     TIMESTAMPTZ,
  last_edited_by     TEXT, -- 마지막 편집 관리자 아이디
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (check_out > check_in),
  CHECK (jsonb_typeof(packages) = 'array' AND jsonb_array_length(packages) > 0),
  -- 같은 객실에 pending/confirmed 상태로 날짜가 겹치는 예약 금지
  CONSTRAINT reservations_no_double_book
    EXCLUDE USING gist (
      room_key WITH =,
      daterange(check_in, check_out, '[)') WITH &&
    ) WHERE (status IN ('pending','confirmed') AND room_key IS NOT NULL)
);

CREATE INDEX idx_reservations_status_created ON reservations (status, created_at DESC);
CREATE INDEX idx_reservations_check_in ON reservations (check_in);
CREATE INDEX idx_reservations_room_key
  ON reservations (room_key, check_in)
  WHERE room_key IS NOT NULL AND status IN ('pending','confirmed');

------------------------------------------------------------
-- reservation_guests
--   name/phone 은 애플리케이션 레벨 AES-256-GCM 암호화 후 Base64 문자열로 저장.
--   phone_hash 는 검색용 SHA-256 (원본 전화번호에서 하이픈/공백 제거 후 해시).
------------------------------------------------------------
CREATE TABLE reservation_guests (
  id                SERIAL PRIMARY KEY,
  reservation_id    INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  name_enc          TEXT NOT NULL,
  phone_enc         TEXT,
  phone_hash        TEXT,
  is_representative BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservation_guests_reservation_id ON reservation_guests(reservation_id);
CREATE INDEX idx_reservation_guests_phone_hash ON reservation_guests(phone_hash) WHERE phone_hash IS NOT NULL;

-- 예약당 대표자 1명 유일성 보장
CREATE UNIQUE INDEX uq_reservation_representative
  ON reservation_guests(reservation_id) WHERE is_representative;

------------------------------------------------------------
-- reservation_history : 상태 변경 감사 로그.
--   admin_username     : .env 아이디 스냅샷 (로그인 식별자)
--   admin_display_name : 액션 발생 시점의 관리자 이름 스냅샷 (표시용)
--   두 값을 함께 저장해서 나중에 .env 를 변경/삭제해도 지난 이력은 당시 정보 그대로 유지.
------------------------------------------------------------
CREATE TABLE reservation_history (
  id                 SERIAL PRIMARY KEY,
  reservation_id     INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  admin_username     TEXT,
  admin_display_name TEXT,
  action             TEXT NOT NULL, -- created | admin_created | confirmed | cancelled | edited
  before_status      reservation_status,
  after_status       reservation_status,
  -- 편집 이력 diff : action='edited' 인 경우 어떤 필드가 어떻게 바뀌었는지
  -- [{ "field": "check_in", "before": "2026-08-01", "after": "2026-08-02" }, ...]
  changes            JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservation_history_reservation_id ON reservation_history(reservation_id, created_at DESC);

------------------------------------------------------------
-- RPC: 예약 상태 전이 + 이력 기록을 원자적으로 처리
------------------------------------------------------------
CREATE OR REPLACE FUNCTION transition_reservation(
  p_reservation_id     INTEGER,
  p_after_status       reservation_status,
  p_admin_username     TEXT,
  p_admin_display_name TEXT
) RETURNS reservations
LANGUAGE plpgsql
AS $$
DECLARE
  v_before reservation_status;
  v_after  reservations;
BEGIN
  SELECT status INTO v_before FROM reservations WHERE id = p_reservation_id FOR UPDATE;
  IF v_before IS NULL THEN
    RAISE EXCEPTION 'reservation not found: %', p_reservation_id;
  END IF;

  UPDATE reservations
     SET status = p_after_status, updated_at = now()
   WHERE id = p_reservation_id
   RETURNING * INTO v_after;

  INSERT INTO reservation_history
    (reservation_id, admin_username, admin_display_name, action, before_status, after_status)
  VALUES
    (p_reservation_id, p_admin_username, p_admin_display_name, p_after_status::TEXT, v_before, p_after_status);

  RETURN v_after;
END;
$$;

------------------------------------------------------------
-- Row Level Security
--   service_role 로만 접근하므로 RLS 를 활성화하고 정책은 두지 않음 (anon/authenticated 차단).
--   service_role 은 RLS 를 우회하므로 서버 API 는 정상 동작.
------------------------------------------------------------
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_guests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_history  ENABLE ROW LEVEL SECURITY;

------------------------------------------------------------
-- GRANT
--   SQL Editor 로 직접 CREATE 한 테이블은 service_role 에 자동 GRANT 가 안 붙는
--   경우가 있어 명시적으로 부여. RLS 우회 + GRANT 둘 다 있어야 서버 API 가 접근 가능.
------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO service_role, anon, authenticated;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 앞으로 이 스키마에 만들어질 객체에도 자동 부여
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

------------------------------------------------------------
-- products 시드 : 성수기/비수기 × 4인/2-3인 × 평일/토요일 × 10 config = 80행
--   현 스코프상 UI 에서는 group_size='4' 만 사용. '2-3' 데이터는 향후 확장 대비 보관.
------------------------------------------------------------
INSERT INTO products (season, group_size, day_type, config_key, name, has_bbq, price) VALUES
-- ===== peak · 4인 · weekday =====
('peak','4','weekday','rides3',        '숙박 + 놀이기구 3종',             false,  65000),
('peak','4','weekday','rides5',        '숙박 + 놀이기구 5종',             false,  79000),
('peak','4','weekday','morning',       '숙박 + 놀이기구 오전무제한',      false,  89000),
('peak','4','weekday','afternoon',     '숙박 + 놀이기구 오후무제한',      false,  99000),
('peak','4','weekday','allday',        '숙박 + 놀이기구 종일무제한',      false, 109000),
('peak','4','weekday','stay_bbq',      '숙박 + BBQ',                      true,   69000),
('peak','4','weekday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,   94000),
('peak','4','weekday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  108000),
('peak','4','weekday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  118000),
('peak','4','weekday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  128000),
('peak','4','weekday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  138000),
-- ===== peak · 4인 · saturday =====
('peak','4','saturday','rides3',        '숙박 + 놀이기구 3종',             false,  75000),
('peak','4','saturday','rides5',        '숙박 + 놀이기구 5종',             false,  89000),
('peak','4','saturday','morning',       '숙박 + 놀이기구 오전무제한',      false,  99000),
('peak','4','saturday','afternoon',     '숙박 + 놀이기구 오후무제한',      false, 109000),
('peak','4','saturday','allday',        '숙박 + 놀이기구 종일무제한',      false, 119000),
('peak','4','saturday','stay_bbq',      '숙박 + BBQ',                      true,   79000),
('peak','4','saturday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,  104000),
('peak','4','saturday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  118000),
('peak','4','saturday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  128000),
('peak','4','saturday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  138000),
('peak','4','saturday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  148000),
-- ===== peak · 3인 · weekday (4인 + 10,000) =====
('peak','3','weekday','rides3',        '숙박 + 놀이기구 3종',             false,  75000),
('peak','3','weekday','rides5',        '숙박 + 놀이기구 5종',             false,  90000),
('peak','3','weekday','morning',       '숙박 + 놀이기구 오전무제한',      false, 100000),
('peak','3','weekday','afternoon',     '숙박 + 놀이기구 오후무제한',      false, 110000),
('peak','3','weekday','allday',        '숙박 + 놀이기구 종일무제한',      false, 120000),
('peak','3','weekday','stay_bbq',      '숙박 + BBQ',                      true,   79000),
('peak','3','weekday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,  104000),
('peak','3','weekday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  119000),
('peak','3','weekday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  129000),
('peak','3','weekday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  139000),
('peak','3','weekday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  149000),
-- ===== peak · 3인 · saturday =====
('peak','3','saturday','rides3',        '숙박 + 놀이기구 3종',             false,  85000),
('peak','3','saturday','rides5',        '숙박 + 놀이기구 5종',             false, 100000),
('peak','3','saturday','morning',       '숙박 + 놀이기구 오전무제한',      false, 110000),
('peak','3','saturday','afternoon',     '숙박 + 놀이기구 오후무제한',      false, 120000),
('peak','3','saturday','allday',        '숙박 + 놀이기구 종일무제한',      false, 130000),
('peak','3','saturday','stay_bbq',      '숙박 + BBQ',                      true,   89000),
('peak','3','saturday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,  114000),
('peak','3','saturday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  129000),
('peak','3','saturday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  139000),
('peak','3','saturday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  149000),
('peak','3','saturday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  159000),
-- ===== peak · 2인 · weekday (4인 + 20,000) =====
('peak','2','weekday','rides3',        '숙박 + 놀이기구 3종',             false,  85000),
('peak','2','weekday','rides5',        '숙박 + 놀이기구 5종',             false, 100000),
('peak','2','weekday','morning',       '숙박 + 놀이기구 오전무제한',      false, 110000),
('peak','2','weekday','afternoon',     '숙박 + 놀이기구 오후무제한',      false, 120000),
('peak','2','weekday','allday',        '숙박 + 놀이기구 종일무제한',      false, 130000),
('peak','2','weekday','stay_bbq',      '숙박 + BBQ',                      true,   89000),
('peak','2','weekday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,  114000),
('peak','2','weekday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  129000),
('peak','2','weekday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  139000),
('peak','2','weekday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  149000),
('peak','2','weekday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  159000),
-- ===== peak · 2인 · saturday =====
('peak','2','saturday','rides3',        '숙박 + 놀이기구 3종',             false,  95000),
('peak','2','saturday','rides5',        '숙박 + 놀이기구 5종',             false, 110000),
('peak','2','saturday','morning',       '숙박 + 놀이기구 오전무제한',      false, 120000),
('peak','2','saturday','afternoon',     '숙박 + 놀이기구 오후무제한',      false, 130000),
('peak','2','saturday','allday',        '숙박 + 놀이기구 종일무제한',      false, 140000),
('peak','2','saturday','stay_bbq',      '숙박 + BBQ',                      true,   99000),
('peak','2','saturday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,  124000),
('peak','2','saturday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  139000),
('peak','2','saturday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  149000),
('peak','2','saturday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  159000),
('peak','2','saturday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  169000),
-- ===== off · 4인 · weekday =====
('off','4','weekday','rides3',        '숙박 + 놀이기구 3종',             false,  55000),
('off','4','weekday','rides5',        '숙박 + 놀이기구 5종',             false,  69000),
('off','4','weekday','morning',       '숙박 + 놀이기구 오전무제한',      false,  79000),
('off','4','weekday','afternoon',     '숙박 + 놀이기구 오후무제한',      false,  89000),
('off','4','weekday','allday',        '숙박 + 놀이기구 종일무제한',      false,  99000),
('off','4','weekday','stay_bbq',      '숙박 + BBQ',                      true,   59000),
('off','4','weekday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,   84000),
('off','4','weekday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,   98000),
('off','4','weekday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  108000),
('off','4','weekday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  118000),
('off','4','weekday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  128000),
-- ===== off · 4인 · saturday =====
('off','4','saturday','rides3',        '숙박 + 놀이기구 3종',             false,  65000),
('off','4','saturday','rides5',        '숙박 + 놀이기구 5종',             false,  79000),
('off','4','saturday','morning',       '숙박 + 놀이기구 오전무제한',      false,  89000),
('off','4','saturday','afternoon',     '숙박 + 놀이기구 오후무제한',      false,  99000),
('off','4','saturday','allday',        '숙박 + 놀이기구 종일무제한',      false, 109000),
('off','4','saturday','stay_bbq',      '숙박 + BBQ',                      true,   69000),
('off','4','saturday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,   94000),
('off','4','saturday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  108000),
('off','4','saturday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  118000),
('off','4','saturday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  128000),
('off','4','saturday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  138000),
-- ===== off · 3인 · weekday =====
('off','3','weekday','rides3',        '숙박 + 놀이기구 3종',             false,  65000),
('off','3','weekday','rides5',        '숙박 + 놀이기구 5종',             false,  80000),
('off','3','weekday','morning',       '숙박 + 놀이기구 오전무제한',      false,  90000),
('off','3','weekday','afternoon',     '숙박 + 놀이기구 오후무제한',      false, 100000),
('off','3','weekday','allday',        '숙박 + 놀이기구 종일무제한',      false, 110000),
('off','3','weekday','stay_bbq',      '숙박 + BBQ',                      true,   69000),
('off','3','weekday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,   94000),
('off','3','weekday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  109000),
('off','3','weekday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  119000),
('off','3','weekday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  129000),
('off','3','weekday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  139000),
-- ===== off · 3인 · saturday =====
('off','3','saturday','rides3',        '숙박 + 놀이기구 3종',             false,  75000),
('off','3','saturday','rides5',        '숙박 + 놀이기구 5종',             false,  90000),
('off','3','saturday','morning',       '숙박 + 놀이기구 오전무제한',      false, 100000),
('off','3','saturday','afternoon',     '숙박 + 놀이기구 오후무제한',      false, 110000),
('off','3','saturday','allday',        '숙박 + 놀이기구 종일무제한',      false, 120000),
('off','3','saturday','stay_bbq',      '숙박 + BBQ',                      true,   79000),
('off','3','saturday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,  104000),
('off','3','saturday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  119000),
('off','3','saturday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  129000),
('off','3','saturday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  139000),
('off','3','saturday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  149000),
-- ===== off · 2인 · weekday =====
('off','2','weekday','rides3',        '숙박 + 놀이기구 3종',             false,  75000),
('off','2','weekday','rides5',        '숙박 + 놀이기구 5종',             false,  90000),
('off','2','weekday','morning',       '숙박 + 놀이기구 오전무제한',      false, 100000),
('off','2','weekday','afternoon',     '숙박 + 놀이기구 오후무제한',      false, 110000),
('off','2','weekday','allday',        '숙박 + 놀이기구 종일무제한',      false, 120000),
('off','2','weekday','stay_bbq',      '숙박 + BBQ',                      true,   79000),
('off','2','weekday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,  104000),
('off','2','weekday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  119000),
('off','2','weekday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  129000),
('off','2','weekday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  139000),
('off','2','weekday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  149000),
-- ===== off · 2인 · saturday =====
('off','2','saturday','rides3',        '숙박 + 놀이기구 3종',             false,  85000),
('off','2','saturday','rides5',        '숙박 + 놀이기구 5종',             false, 100000),
('off','2','saturday','morning',       '숙박 + 놀이기구 오전무제한',      false, 110000),
('off','2','saturday','afternoon',     '숙박 + 놀이기구 오후무제한',      false, 120000),
('off','2','saturday','allday',        '숙박 + 놀이기구 종일무제한',      false, 130000),
('off','2','saturday','stay_bbq',      '숙박 + BBQ',                      true,   89000),
('off','2','saturday','rides3_bbq',    '숙박 + 놀이기구 3종 + BBQ',       true,  114000),
('off','2','saturday','rides5_bbq',    '숙박 + 놀이기구 5종 + BBQ',       true,  129000),
('off','2','saturday','morning_bbq',   '숙박 + 놀이기구 오전무제한 + BBQ', true,  139000),
('off','2','saturday','afternoon_bbq', '숙박 + 놀이기구 오후무제한 + BBQ', true,  149000),
('off','2','saturday','allday_bbq',    '숙박 + 놀이기구 종일무제한 + BBQ', true,  159000);

COMMIT;
