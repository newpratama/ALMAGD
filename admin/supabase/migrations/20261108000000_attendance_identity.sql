-- Identity is resolved at ingestion, on the server, from the manager's PIN mapping.
-- Keep the name snapshot on the log; never rewrite history when a PIN is reassigned.
ALTER TABLE public.attendance_settings
  ADD COLUMN calculation_mode TEXT NOT NULL DEFAULT 'first_last'
    CHECK (calculation_mode IN ('first_last', 'explicit')),
  ADD COLUMN duplicate_window_minutes INTEGER NOT NULL DEFAULT 5
    CHECK (duplicate_window_minutes BETWEEN 0 AND 60);

CREATE FUNCTION public.validate_attendance_mapping() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_id TEXT;
  v_pin TEXT;
  v_employee JSONB;
  v_seen TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF jsonb_typeof(NEW.pin_mapping) IS DISTINCT FROM 'object'
     OR jsonb_typeof(NEW.custom_employees) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Invalid attendance employee mapping' USING ERRCODE = '22023';
  END IF;
  IF NEW.shift_start IS NULL OR NEW.shift_end IS NULL OR NEW.shift_start = NEW.shift_end
     OR NEW.late_tolerance IS NULL OR NEW.late_tolerance < 0 THEN
    RAISE EXCEPTION 'Invalid attendance shift' USING ERRCODE = '22023';
  END IF;
  FOR v_id, v_pin IN SELECT key, trim(value) FROM jsonb_each_text(NEW.pin_mapping) LOOP
    IF coalesce(v_pin, '') = '' THEN CONTINUE; END IF;
    IF length(v_pin) > 32 OR v_pin = ANY(v_seen) THEN
      RAISE EXCEPTION 'Duplicate or invalid attendance PIN: %', v_pin USING ERRCODE = '22023';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.staff WHERE id::TEXT = v_id) THEN
      RAISE EXCEPTION 'Attendance mapping refers to an unknown staff member' USING ERRCODE = '22023';
    END IF;
    v_seen := array_append(v_seen, v_pin);
  END LOOP;
  FOR v_employee IN SELECT value FROM jsonb_array_elements(NEW.custom_employees) LOOP
    v_pin := trim(v_employee->>'pin');
    IF coalesce(v_pin, '') = '' OR length(v_pin) > 32
       OR coalesce(trim(v_employee->>'name'), '') = '' OR v_pin = ANY(v_seen) THEN
      RAISE EXCEPTION 'Duplicate or invalid attendance employee PIN: %', v_pin USING ERRCODE = '22023';
    END IF;
    v_seen := array_append(v_seen, v_pin);
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER attendance_mapping_validation
BEFORE INSERT OR UPDATE ON public.attendance_settings
FOR EACH ROW EXECUTE FUNCTION public.validate_attendance_mapping();

CREATE FUNCTION public.resolve_attendance_identity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_settings public.attendance_settings%ROWTYPE;
  v_staff_id UUID;
  v_name TEXT;
  v_matches INTEGER;
BEGIN
  NEW.pin := trim(NEW.pin);
  SELECT * INTO v_settings FROM public.attendance_settings WHERE id = 'default';
  SELECT count(*), min(s.id::TEXT)::UUID, min(s.full_name)
    INTO v_matches, v_staff_id, v_name
    FROM jsonb_each_text(coalesce(v_settings.pin_mapping, '{}'::JSONB)) m
    JOIN public.staff s ON s.id::TEXT = m.key
    WHERE trim(m.value) = NEW.pin;

  v_matches := v_matches + (SELECT count(*)
    FROM jsonb_array_elements(coalesce(v_settings.custom_employees, '[]'::JSONB)) e
    WHERE trim(e->>'pin') = NEW.pin);
  IF v_matches > 1 THEN
    RAISE EXCEPTION 'Ambiguous attendance PIN: %', NEW.pin USING ERRCODE = '22023';
  END IF;

  IF v_staff_id IS NOT NULL THEN
    IF NEW.staff_id IS NOT NULL AND NEW.staff_id <> v_staff_id THEN
      RAISE EXCEPTION 'Attendance staff ID does not match PIN' USING ERRCODE = '22023';
    END IF;
    NEW.staff_id := v_staff_id;
    NEW.staff_name := v_name;
  ELSE
    SELECT trim(e->>'name') INTO v_name
      FROM jsonb_array_elements(coalesce(v_settings.custom_employees, '[]'::JSONB)) e
      WHERE trim(e->>'pin') = NEW.pin;
    -- A custom employee is identified by PIN; do not invent a staff UUID.
    NEW.staff_id := NULL;
    NEW.staff_name := coalesce(v_name, nullif(left(trim(NEW.staff_name), 120), ''));
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER attendance_identity_on_insert
BEFORE INSERT ON public.attendance_logs
FOR EACH ROW EXECUTE FUNCTION public.resolve_attendance_identity();

REVOKE ALL ON FUNCTION public.validate_attendance_mapping() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_attendance_identity() FROM PUBLIC;

-- The device key may supply its user display name, but never a staff UUID.
CREATE OR REPLACE FUNCTION public.ingest_attendance(p_key TEXT, p_rows JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_hash     TEXT;
    v_received INTEGER;
    v_inserted INTEGER;
BEGIN
    v_hash := encode(sha256(convert_to(coalesce(p_key, ''), 'UTF8')), 'hex');

    IF NOT EXISTS (
        SELECT 1 FROM public.attendance_device_keys WHERE key_hash = v_hash AND active
    ) THEN
        RAISE EXCEPTION 'invalid device key' USING ERRCODE = '42501';
    END IF;

    IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
        RAISE EXCEPTION 'rows must be a JSON array' USING ERRCODE = '22023';
    END IF;

    v_received := jsonb_array_length(p_rows);
    IF v_received > 500 THEN
        RAISE EXCEPTION 'too many rows (max 500)' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.attendance_logs
        (pin, scan_time, punch_type, verify_type, device_sn, source, staff_name)
    SELECT
        trim(r.pin),
        r.scan_time,
        CASE WHEN r.punch_type IN
            ('check_in','check_out','break_out','break_in','overtime_in','overtime_out')
            THEN r.punch_type ELSE 'check_in' END,
        CASE WHEN r.verify_type IN ('fingerprint','password','card','manual')
            THEN r.verify_type ELSE 'fingerprint' END,
        left(coalesce(r.device_sn, ''), 64),
        'biometric_sync',
        nullif(left(trim(r.staff_name), 120), '')
    FROM jsonb_to_recordset(p_rows)
        AS r(pin TEXT, scan_time TIMESTAMPTZ, punch_type TEXT, verify_type TEXT, device_sn TEXT, staff_name TEXT)
    WHERE nullif(trim(r.pin), '') IS NOT NULL
      AND length(trim(r.pin)) <= 32
      AND r.scan_time IS NOT NULL
    ON CONFLICT (pin, scan_time) DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;

    UPDATE public.attendance_device_keys SET last_used_at = now() WHERE key_hash = v_hash;

    RETURN jsonb_build_object('received', v_received, 'inserted', v_inserted);
END;
$$;

REVOKE ALL ON FUNCTION public.ingest_attendance(TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_attendance(TEXT, JSONB) TO anon, authenticated;

