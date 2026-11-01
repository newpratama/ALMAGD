-- Migration: 20261101000000_attendance.sql
-- Description: Create attendance logs and settings tables for biometric integration

-- 1. Create attendance_logs table
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pin TEXT NOT NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    staff_name TEXT,
    scan_time TIMESTAMPTZ NOT NULL,
    punch_type TEXT NOT NULL DEFAULT 'check_in', -- check_in, check_out, break_out, break_in, overtime_in, overtime_out
    verify_type TEXT NOT NULL DEFAULT 'fingerprint', -- fingerprint, password, card, manual
    device_sn TEXT DEFAULT '616230026280266',
    device_ip TEXT,
    source TEXT NOT NULL DEFAULT 'biometric_sync', -- biometric_sync, cloud_api, usb_import, manual
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT attendance_logs_pin_scantime_uniq UNIQUE (pin, scan_time)
);

-- Index for fast daily queries
CREATE INDEX IF NOT EXISTS idx_attendance_logs_scan_time ON public.attendance_logs (scan_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_pin ON public.attendance_logs (pin);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_staff_id ON public.attendance_logs (staff_id);

-- 2. Create attendance_settings table
CREATE TABLE IF NOT EXISTS public.attendance_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    device_ip TEXT DEFAULT '192.168.1.201',
    device_port INTEGER DEFAULT 4370,
    device_sn TEXT DEFAULT '616230026280266',
    cloud_id TEXT DEFAULT '616230026280266',
    api_token TEXT DEFAULT 'HENLQ0WVR7KVHXC3',
    shift_start TEXT DEFAULT '08:00',
    shift_end TEXT DEFAULT '16:00',
    late_tolerance INTEGER DEFAULT 15,
    auto_sync BOOLEAN DEFAULT true,
    pin_mapping JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Insert default settings row if not exists
INSERT INTO public.attendance_settings (
    id,
    device_ip,
    device_port,
    device_sn,
    cloud_id,
    api_token,
    shift_start,
    shift_end,
    late_tolerance,
    auto_sync
)
VALUES (
    'default',
    '192.168.1.201',
    4370,
    '616230026280266',
    '616230026280266',
    'HENLQ0WVR7KVHXC3',
    '08:00',
    '16:00',
    15,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Row Level Security (RLS)
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated staff to view and manage attendance
CREATE POLICY "Staff can view attendance logs" ON public.attendance_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can insert attendance logs" ON public.attendance_logs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Managers can update attendance logs" ON public.attendance_logs
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Managers can delete attendance logs" ON public.attendance_logs
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "Staff can view attendance settings" ON public.attendance_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can update attendance settings" ON public.attendance_settings
    FOR ALL TO authenticated USING (true);

-- Allow service role and anon read/insert for sync bridge
CREATE POLICY "Allow anon insert attendance with valid sn" ON public.attendance_logs
    FOR INSERT TO anon WITH CHECK (device_sn IS NOT NULL);

CREATE POLICY "Allow anon select attendance settings" ON public.attendance_settings
    FOR SELECT TO anon USING (true);
