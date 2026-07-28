BEGIN;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS reservation_type TEXT NOT NULL DEFAULT 'stay'
  CHECK (reservation_type IN ('stay','day_use'));

CREATE INDEX IF NOT EXISTS idx_reservations_type_check_in
  ON reservations (reservation_type, check_in);

-- 현재 기존 room_key IS NULL 예약은 전부 당일예약이므로 모두 당일예약으로 분류.
UPDATE reservations
   SET reservation_type = 'day_use',
       updated_at = now()
 WHERE room_key IS NULL;

COMMIT;
