BEGIN;

CREATE OR REPLACE FUNCTION swap_reservation_rooms(
  p_id_a               INTEGER,
  p_id_b               INTEGER,
  p_admin_username     TEXT,
  p_admin_display_name TEXT
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_status_a    reservation_status;
  v_status_b    reservation_status;
  v_type_a      TEXT;
  v_type_b      TEXT;
  v_room_a      TEXT;
  v_room_b      TEXT;
  v_check_in_a  DATE;
  v_check_in_b  DATE;
  v_check_out_a DATE;
  v_check_out_b DATE;
BEGIN
  IF p_id_a = p_id_b THEN
    RAISE EXCEPTION 'swap requires two distinct reservations';
  END IF;

  -- Lock rows in a stable order so concurrent reverse swaps do not deadlock.
  PERFORM 1
    FROM reservations
   WHERE id IN (p_id_a, p_id_b)
   ORDER BY id
   FOR UPDATE;

  SELECT status, reservation_type, room_key, check_in, check_out
    INTO v_status_a, v_type_a, v_room_a, v_check_in_a, v_check_out_a
    FROM reservations WHERE id = p_id_a;
  IF v_status_a IS NULL THEN
    RAISE EXCEPTION 'reservation not found: %', p_id_a;
  END IF;

  SELECT status, reservation_type, room_key, check_in, check_out
    INTO v_status_b, v_type_b, v_room_b, v_check_in_b, v_check_out_b
    FROM reservations WHERE id = p_id_b;
  IF v_status_b IS NULL THEN
    RAISE EXCEPTION 'reservation not found: %', p_id_b;
  END IF;

  IF v_type_a <> 'stay' OR v_type_b <> 'stay' THEN
    RAISE EXCEPTION 'both reservations must be stay reservations to swap';
  END IF;

  IF v_check_in_a <> v_check_in_b OR v_check_out_a <> v_check_out_b THEN
    RAISE EXCEPTION 'both reservations must have identical check-in and check-out dates to swap';
  END IF;

  IF v_status_a <> 'confirmed' OR v_status_b <> 'confirmed' THEN
    RAISE EXCEPTION 'both reservations must be confirmed to swap';
  END IF;

  IF v_room_a IS NULL OR v_room_b IS NULL THEN
    RAISE EXCEPTION 'both reservations must have room_key assigned';
  END IF;

  UPDATE reservations SET room_key = NULL, updated_at = now() WHERE id IN (p_id_a, p_id_b);

  UPDATE reservations SET room_key = v_room_b, updated_at = now() WHERE id = p_id_a;
  UPDATE reservations SET room_key = v_room_a, updated_at = now() WHERE id = p_id_b;

  INSERT INTO reservation_history
    (reservation_id, admin_username, admin_display_name, action, before_status, after_status, changes)
  VALUES
    (p_id_a, p_admin_username, p_admin_display_name, 'room_swapped', 'confirmed', 'confirmed',
     jsonb_build_array(jsonb_build_object('field','roomKey','before',v_room_a,'after',v_room_b,'swappedWith',p_id_b))),
    (p_id_b, p_admin_username, p_admin_display_name, 'room_swapped', 'confirmed', 'confirmed',
     jsonb_build_array(jsonb_build_object('field','roomKey','before',v_room_b,'after',v_room_a,'swappedWith',p_id_a)));
END;
$$;

COMMIT;
