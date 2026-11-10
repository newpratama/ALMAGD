-- Migration: 20261101120000_attendance_hardening.sql
-- Description: Lock down attendance tables (manager-only), remove anonymous access,
--              add a device-key protected ingestion RPC for the reception sync tool,
--              realtime publication, and schema drift fix (custom_employees).
--
-- TIME CONVENTION: scan_time stores the device's WALL-CLOCK time as if it were UTC
-- ("floating time"). The sync tool sends e.g. 2026-11-01T08:05:00+00:00 for a punch made
-- at 08:05 hotel time. Never apply timezone conversion to this column.

-- 1. Schema drift: column already exists in production but was never in a migration
ALTER TABLE public.attendance_settings
    ADD COLUMN IF NOT EXISTS custom_employees JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Secrets must not live in column defaults
ALTER TABLE public.attendance_settings ALTER COLUMN api_token DROP DEFAULT;

-- 2. Remove every permissive / anonymous policy created by the first migration
DROP POLICY IF EXISTS "Staff can view attendance logs"            ON public.attendance_logs;
DROP POLICY IF EXISTS "Managers can insert attendance logs"       ON public.attendance_logs;
DROP POLICY IF EXISTS "Managers can update attendance logs"       ON public.attendance_logs;
DROP POLICY IF EXISTS "Managers can delete attendance logs"       ON public.attendance_logs;
DROP POLICY IF EXISTS "Allow anon insert attendance with valid sn" ON public.attendance_logs;
DROP POLICY IF EXISTS "Staff can view attendance settings"        ON public.attendance_settings;
DROP POLICY IF EXISTS "Managers can update attendance settings"   ON public.attendance_settings;
DROP POLICY IF EXISTS "Allow anon select attendance settings"     ON public.attendance_settings;

-- 3. Manager-only policies (same helper used by the rest of the schema)
CREATE POLICY attendance_logs_select ON public.attendance_logs
    FOR SELECT TO authenticated USING (public.is_manager());
CREATE POLICY attendance_logs_insert ON public.attendance_logs
    FOR INSERT TO authenticated WITH CHECK (public.is_manager());
CREATE POLICY attendance_logs_update ON public.attendance_logs
    FOR UPDATE TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());
CREATE POLICY attendance_logs_delete ON public.attendance_logs
    FOR DELETE TO authenticated USING (public.is_manager());

CREATE POLICY attendance_settings_all ON public.attendance_settings
    FOR ALL TO authenticated USING (public.is_manager()) WITH CHECK (public.is_manager());

-- 4. Device keys: only SHA-256 hashes are stored; table is invisible to API roles
CREATE TABLE IF NOT EXISTS public.attendance_device_keys (
    key_hash     TEXT PRIMARY KEY,
    label        TEXT NOT NULL DEFAULT 'reception-pc',
    active       BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_used_at TIMESTAMPTZ
);
ALTER TABLE public.attendance_device_keys ENABLE ROW LEVEL SECURITY; -- no policies = no access
REVOKE ALL ON public.attendance_device_keys FROM anon, authenticated;

-- 5. Ingestion RPC used by biometric-sync-tool (the ONLY write path for anon callers)
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
        (pin, scan_time, punch_type, verify_type, device_sn, source)
    SELECT
        trim(r.pin),
        r.scan_time,
        CASE WHEN r.punch_type IN
            ('check_in','check_out','break_out','break_in','overtime_in','overtime_out')
            THEN r.punch_type ELSE 'check_in' END,
        CASE WHEN r.verify_type IN ('fingerprint','password','card','manual')
            THEN r.verify_type ELSE 'fingerprint' END,
        left(coalesce(r.device_sn, ''), 64),
        'biometric_sync'
    FROM jsonb_to_recordset(p_rows)
        AS r(pin TEXT, scan_time TIMESTAMPTZ, punch_type TEXT, verify_type TEXT, device_sn TEXT)
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

-- 6. Realtime for the attendance screen (RLS still applies to subscribers)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public' AND tablename = 'attendance_logs')
    THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_logs;
    END IF;
END $$;
