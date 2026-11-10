-- Run inside a transaction after the attendance migrations. Caller rolls back.
DO $$
DECLARE
  v_staff UUID := 'a1100000-0000-4000-8000-000000000001';
  v_other UUID := 'a1100000-0000-4000-8000-000000000002';
  v_row public.attendance_logs%ROWTYPE;
  v_ok BOOLEAN;
BEGIN
  INSERT INTO auth.users (id) VALUES (v_staff), (v_other);
  INSERT INTO public.staff (id, full_name, role) VALUES
    (v_staff, 'Attendance Test Employee', 'reception'), (v_other, 'Other Employee', 'reception');
  UPDATE public.attendance_settings SET
    pin_mapping = jsonb_build_object(v_staff::TEXT, '001'),
    custom_employees = '[{"pin":"22","name":"Attendance Test Cleaner"}]'::JSONB
    WHERE id = 'default';
  INSERT INTO public.attendance_device_keys(key_hash)
    VALUES (encode(sha256(convert_to('attendance-test-key', 'UTF8')), 'hex'));
  PERFORM public.ingest_attendance('attendance-test-key',
    '[{"pin":"001","scan_time":"2026-11-01T08:00:00+00:00","punch_type":"check_in"}]');
  SELECT * INTO v_row FROM public.attendance_logs WHERE pin = '001';
  IF v_row.staff_id IS DISTINCT FROM v_staff OR v_row.staff_name IS DISTINCT FROM 'Attendance Test Employee'
     OR v_row.scan_time IS DISTINCT FROM '2026-11-01T08:00:00+00:00'::TIMESTAMPTZ THEN
    RAISE EXCEPTION 'FAIL identity and exact scan time on RPC ingestion';
  END IF;
  PERFORM public.ingest_attendance('attendance-test-key',
    '[{"pin":"001","scan_time":"2026-11-01T08:00:00+00:00"}]');
  IF (SELECT count(*) FROM public.attendance_logs WHERE pin = '001') <> 1 THEN
    RAISE EXCEPTION 'FAIL duplicate suppression';
  END IF;
  INSERT INTO public.attendance_logs(pin, scan_time, source) VALUES
    ('22', '2026-11-01T09:00:00Z', 'cloud_api'), ('999', '2026-11-01T09:01:00Z', 'biometric_sync');
  IF NOT EXISTS (SELECT 1 FROM public.attendance_logs WHERE pin='22' AND staff_id IS NULL AND staff_name='Attendance Test Cleaner')
     OR NOT EXISTS (SELECT 1 FROM public.attendance_logs WHERE pin='999' AND staff_id IS NULL AND staff_name IS NULL) THEN
    RAISE EXCEPTION 'FAIL custom/unknown identity';
  END IF;
  PERFORM public.ingest_attendance('attendance-test-key',
    '[{"pin":"device-only","scan_time":"2026-11-01T09:05:00Z","staff_name":"Device Display Name"}]');
  IF NOT EXISTS (SELECT 1 FROM public.attendance_logs WHERE pin='device-only' AND staff_id IS NULL AND staff_name='Device Display Name') THEN
    RAISE EXCEPTION 'FAIL device display name fallback';
  END IF;
  v_ok := false;
  BEGIN
    UPDATE public.attendance_settings SET pin_mapping = jsonb_build_object(v_staff::TEXT, '001', v_other::TEXT, '001') WHERE id='default';
  EXCEPTION WHEN SQLSTATE '22023' THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL duplicate staff PIN accepted'; END IF;
  v_ok := false;
  BEGIN
    UPDATE public.attendance_settings SET custom_employees = '[{"pin":"001","name":"Duplicate"}]' WHERE id='default';
  EXCEPTION WHEN SQLSTATE '22023' THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL duplicate custom PIN accepted'; END IF;
  v_ok := false;
  BEGIN
    INSERT INTO public.attendance_logs(pin, staff_id, scan_time) VALUES ('001', v_other, '2026-11-01T10:00:00Z');
  EXCEPTION WHEN SQLSTATE '22023' THEN v_ok := true;
  END;
  IF NOT v_ok THEN RAISE EXCEPTION 'FAIL mismatched staff identity accepted'; END IF;
  UPDATE public.attendance_settings SET pin_mapping = jsonb_build_object(v_other::TEXT, '001') WHERE id='default';
  IF NOT EXISTS (SELECT 1 FROM public.attendance_logs WHERE pin='001' AND staff_id=v_staff AND staff_name='Attendance Test Employee') THEN
    RAISE EXCEPTION 'FAIL historical identity changed';
  END IF;
  INSERT INTO public.attendance_logs(pin, scan_time) VALUES ('001', '2026-11-02T08:00:00Z');
  IF NOT EXISTS (SELECT 1 FROM public.attendance_logs WHERE pin='001' AND staff_id=v_other AND staff_name='Other Employee') THEN
    RAISE EXCEPTION 'FAIL new identity after reassignment';
  END IF;
  RAISE NOTICE 'PASS ingestion identity, scan time, duplicate protection, custom/unknown employees, mapping validation and historical snapshots';
END $$;
