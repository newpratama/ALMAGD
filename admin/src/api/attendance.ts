import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { StaffMember } from './staff';
import { addDaysISO } from '../lib/dates';

export interface AttendanceRecord {
  id: string;
  pin: string;
  staffId?: string | null;
  staffName?: string | null;
  scanTime: string; // YYYY-MM-DD HH:mm:ss
  punchType: 'check_in' | 'check_out' | 'break_out' | 'break_in' | 'overtime_in' | 'overtime_out';
  verifyType: string; // fingerprint, password, card, manual
  deviceSn: string;
  deviceIp?: string | null;
  source: 'biometric_sync' | 'cloud_api' | 'usb_import' | 'manual';
  notes?: string | null;
  createdAt?: string;
}

export interface BiometricEmployee {
  pin: string;
  name: string;
  role?: string;
}

export interface AttendanceSettings {
  deviceIp: string;
  devicePort: number;
  deviceSn: string;
  cloudId: string;
  apiToken: string;
  shiftStart: string; // "08:00"
  shiftEnd: string; // "16:00"
  lateTolerance: number; // 15 mins
  autoSync: boolean;
  calculationMode?: 'first_last' | 'explicit';
  duplicateWindowMinutes?: number;
  pinMapping: Record<string, string>; // staffId -> pin (e.g. { "uuid-1": "1", "uuid-2": "2" })
  customEmployees?: BiometricEmployee[];
}

export interface DailyStaffAttendance {
  staffId: string;
  staffName: string;
  role: string;
  pin: string;
  date: string;
  firstIn: string | null; // "08:10"
  lastOut: string | null; // "16:05"
  totalHours: number; // e.g. 7.9
  lateMinutes: number; // e.g. 10
  status: 'present_on_time' | 'late' | 'early_leave' | 'absent' | 'incomplete';
  punches: AttendanceRecord[];
}

const LOCAL_STORAGE_LOGS_KEY = 'almagd_attendance_logs_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'almagd_attendance_settings_v1';

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  deviceIp: '192.168.1.205',
  devicePort: 4370,
  deviceSn: '616230026280266',
  cloudId: '616230026280266',
  apiToken: 'HENLQ0WVR7KVHXC3',
  shiftStart: '08:00',
  shiftEnd: '16:00',
  lateTolerance: 15,
  autoSync: true,
  calculationMode: 'first_last',
  duplicateWindowMinutes: 5,
  pinMapping: {},
  customEmployees: [],
};

// ---------------------------------------------------------------------------
// Settings API
// ---------------------------------------------------------------------------

export async function fetchAttendanceSettings(): Promise<AttendanceSettings> {
  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await (supabase as any)
        .from('attendance_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        return {
          deviceIp: data.device_ip || DEFAULT_ATTENDANCE_SETTINGS.deviceIp,
          devicePort: data.device_port || DEFAULT_ATTENDANCE_SETTINGS.devicePort,
          deviceSn: data.device_sn || DEFAULT_ATTENDANCE_SETTINGS.deviceSn,
          cloudId: data.cloud_id || DEFAULT_ATTENDANCE_SETTINGS.cloudId,
          apiToken: data.api_token || DEFAULT_ATTENDANCE_SETTINGS.apiToken,
          shiftStart: data.shift_start || DEFAULT_ATTENDANCE_SETTINGS.shiftStart,
          shiftEnd: data.shift_end || DEFAULT_ATTENDANCE_SETTINGS.shiftEnd,
          lateTolerance: data.late_tolerance ?? DEFAULT_ATTENDANCE_SETTINGS.lateTolerance,
          autoSync: data.auto_sync ?? DEFAULT_ATTENDANCE_SETTINGS.autoSync,
          calculationMode: data.calculation_mode ?? 'first_last',
          duplicateWindowMinutes: data.duplicate_window_minutes ?? 5,
          pinMapping: (data.pin_mapping as Record<string, string>) || DEFAULT_ATTENDANCE_SETTINGS.pinMapping,
          customEmployees: (data.custom_employees as BiometricEmployee[]) || [],
        };
      }
    } catch {
      // Fall through to local storage
    }
  }

  // Fallback to localStorage
  const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_ATTENDANCE_SETTINGS,
        ...parsed,
        pinMapping: parsed.pinMapping || {},
        customEmployees: parsed.customEmployees || [],
      };
    } catch {
      // ignore
    }
  }
  return DEFAULT_ATTENDANCE_SETTINGS;
}

export function validateAttendanceSettings(settings: AttendanceSettings): void {
  const used = new Set<string>();
  const pins = [...Object.values(settings.pinMapping || {}), ...(settings.customEmployees || []).map((e) => e.pin)];
  for (const raw of pins) {
    const pin = String(raw).trim();
    if (!pin) continue;
    if (used.has(pin)) throw new Error(`رقم البصمة مرتبط بأكثر من موظف / PIN terdaftar ganda: ${pin}`);
    if (pin.length > 32) throw new Error('PIN: maximum 32 characters');
    used.add(pin);
  }
  if ((settings.customEmployees || []).some((e) => !e.pin.trim() || !e.name.trim())) {
    throw new Error('اسم الموظف ورقم البصمة مطلوبان / Nama dan PIN wajib diisi');
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.shiftStart) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.shiftEnd) || settings.shiftStart === settings.shiftEnd) {
    throw new Error('أوقات الوردية غير صالحة / Jam shift tidak valid');
  }
  const window = settings.duplicateWindowMinutes ?? 5;
  if (!Number.isInteger(window) || window < 0 || window > 60 || !Number.isFinite(settings.lateTolerance) || settings.lateTolerance < 0) {
    throw new Error('إعدادات السماح غير صالحة / Toleransi tidak valid');
  }
}

/** A night shift belongs to its start date. The gap between shifts supplies the day boundary. */
export function attendanceWindow(date: string, settings?: Pick<AttendanceSettings, 'shiftStart' | 'shiftEnd'>) {
  const minutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  let boundary = 0;
  if (settings && settings.shiftEnd < settings.shiftStart) {
    boundary = Math.floor((minutes(settings.shiftEnd) + minutes(settings.shiftStart)) / 2);
  }
  const clock = `${String(Math.floor(boundary / 60)).padStart(2, '0')}:${String(boundary % 60).padStart(2, '0')}:00`;
  return { start: `${date} ${clock}`, end: `${addDaysISO(date, 1)} ${clock}` };
}

export async function saveAttendanceSettings(settings: AttendanceSettings): Promise<AttendanceSettings> {
  validateAttendanceSettings(settings);
  settings = {
    ...settings,
    pinMapping: Object.fromEntries(Object.entries(settings.pinMapping || {}).map(([id, pin]) => [id, pin.trim()])),
    customEmployees: (settings.customEmployees || []).map((e) => ({ ...e, pin: e.pin.trim(), name: e.name.trim() })),
  };

  if (supabase) {
    try {
      const { error } = await (supabase as any).from('attendance_settings').upsert({
        id: 'default',
        device_ip: settings.deviceIp,
        device_port: settings.devicePort,
        device_sn: settings.deviceSn,
        cloud_id: settings.cloudId,
        api_token: settings.apiToken,
        shift_start: settings.shiftStart,
        shift_end: settings.shiftEnd,
        late_tolerance: settings.lateTolerance,
        auto_sync: settings.autoSync,
        calculation_mode: settings.calculationMode ?? 'first_last',
        duplicate_window_minutes: settings.duplicateWindowMinutes ?? 5,
        pin_mapping: settings.pinMapping,
        custom_employees: settings.customEmployees || [],
        updated_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    } catch (e) {
      throw e;
    }
  }

  localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  return settings;
}

export function useAttendanceSettings() {
  return useQuery({
    queryKey: ['attendance-settings'],
    queryFn: fetchAttendanceSettings,
  });
}

export function useUpdateAttendanceSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAttendanceSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-settings'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
    },
  });
}

export const useSaveAttendanceSettings = useUpdateAttendanceSettings;

// ---------------------------------------------------------------------------
// Logs API
// ---------------------------------------------------------------------------

/**
 * Punch times are device WALL-CLOCK times stored as "floating" UTC (see the attendance
 * hardening migration). Normalise every representation to `YYYY-MM-DD HH:mm:ss` so
 * Supabase rows ("2026-11-01T08:05:00+00:00"), cloud rows and local cache rows share one
 * de-duplication key and one display format. Never apply timezone conversion here.
 */
export function normalizeScanTime(raw: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec((raw || '').trim());
  return m ? `${m[1]} ${m[2]}:${m[3]}:${m[4] ?? '00'}` : raw || '';
}

/** Convert a normalised wall-clock time to the floating-UTC ISO string stored in Supabase. */
function toFloatingIso(scanTime: string): string {
  return `${normalizeScanTime(scanTime).replace(' ', 'T')}+00:00`;
}

const LOCAL_LOGS_MAX = 2000;
const LOCAL_LOGS_KEEP_DAYS = 45;

function readLocalLogs(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    const list: AttendanceRecord[] = raw ? JSON.parse(raw) : [];
    return list.map((l) => ({ ...l, scanTime: normalizeScanTime(l.scanTime) }));
  } catch {
    return [];
  }
}

/** Offline safety net only: records are kept here when Supabase could not be reached. */
function writeLocalLogs(list: AttendanceRecord[]): void {
  const cutoff = new Date(Date.now() - LOCAL_LOGS_KEEP_DAYS * 86400000).toISOString().slice(0, 10);
  const pruned = list
    .filter((l) => l.scanTime.slice(0, 10) >= cutoff)
    .sort((a, b) => a.scanTime.localeCompare(b.scanTime))
    .slice(-LOCAL_LOGS_MAX);
  try {
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(pruned));
  } catch (e) {
    console.warn('Could not persist offline attendance cache:', e);
  }
}

function addLocalLogs(records: AttendanceRecord[]): number {
  const existing = readLocalLogs();
  const keys = new Set(existing.map((l) => `${l.pin}_${l.scanTime}`));
  let added = 0;
  for (const r of records) {
    const rec = { ...r, scanTime: normalizeScanTime(r.scanTime) };
    const k = `${rec.pin}_${rec.scanTime}`;
    if (!keys.has(k)) {
      keys.add(k);
      existing.push(rec);
      added++;
    }
  }
  writeLocalLogs(existing);
  return added;
}

/** Push offline-cached records to Supabase once it is reachable again, then clear them. */
async function flushLocalLogs(): Promise<void> {
  const pending = readLocalLogs();
  if (!supabase || pending.length === 0) return;
  const { error } = await (supabase as any).from('attendance_logs').upsert(
    pending.map((r) => ({
      pin: r.pin,
      staff_id: r.staffId && !/^(custom|biometric)-/.test(r.staffId) ? r.staffId : null,
      staff_name: r.staffName ?? null,
      scan_time: toFloatingIso(r.scanTime),
      punch_type: r.punchType,
      verify_type: r.verifyType || 'manual',
      device_sn: r.deviceSn || null,
      source: r.source || 'manual',
      notes: r.notes ?? null,
    })),
    { onConflict: 'pin,scan_time', ignoreDuplicates: true }
  );
  if (!error) writeLocalLogs([]);
}

export async function fetchAttendanceLogs(date: string, settings?: AttendanceSettings): Promise<AttendanceRecord[]> {
  const window = attendanceWindow(date, settings);
  const startOfDay = toFloatingIso(window.start);
  const startOfNextDay = toFloatingIso(window.end);
  let logs: AttendanceRecord[] = [];

  // Read every page. Supabase's default response limit must not truncate busy days.
  if (!supabase) throw new Error('Supabase not configured');
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await (supabase as any)
      .from('attendance_logs').select('*')
      .gte('scan_time', startOfDay).lt('scan_time', startOfNextDay)
      .order('scan_time', { ascending: true }).order('id', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error; // A failed read must never turn everyone into "absent".
    const page = data || [];
    logs.push(...page.map((d: any) => ({
      id: d.id, pin: String(d.pin), staffId: d.staff_id, staffName: d.staff_name,
      scanTime: normalizeScanTime(d.scan_time), punchType: d.punch_type || 'check_in',
      verifyType: d.verify_type || 'fingerprint', deviceSn: d.device_sn || '',
      deviceIp: d.device_ip, source: d.source || 'biometric_sync', notes: d.notes, createdAt: d.created_at,
    })));
    if (page.length < pageSize) break;
  }
  void flushLocalLogs().catch(() => undefined);

  // 2. Merge with local offline cache (only holds records Supabase has not confirmed)
  const existingKeys = new Set(logs.map((l) => `${l.pin}_${l.scanTime}`));
  for (const item of readLocalLogs()) {
    if (item.scanTime >= window.start && item.scanTime < window.end && !existingKeys.has(`${item.pin}_${item.scanTime}`)) {
      logs.push(item);
    }
  }

  logs.sort((a, b) => a.scanTime.localeCompare(b.scanTime));
  return logs;
}

export function useAttendanceLogs(date: string, settings?: AttendanceSettings) {
  return useQuery({
    queryKey: ['attendance-logs', date, settings?.shiftStart, settings?.shiftEnd],
    queryFn: () => fetchAttendanceLogs(date, settings),
    enabled: !!settings,
    refetchInterval: 1000 * 60, // safety net; live updates arrive via Supabase Realtime (DataSyncProvider)
  });
}

// ---------------------------------------------------------------------------
// Cloud Sync Integration (developer.fingerspot.io)
// ---------------------------------------------------------------------------

export async function syncFingerspotCloud(
  date: string,
  token?: string,
  cloudId?: string
): Promise<{ added: number; total: number; message: string; newPunchesCount: number; savedRemotely: boolean }> {
  const settings = await fetchAttendanceSettings();
  const apiToken = token || settings.apiToken || 'HENLQ0WVR7KVHXC3';
  const cId = cloudId || settings.cloudId || '616230026280266';

  if (!apiToken) {
    throw new Error('API Token is required');
  }

  const payload = {
    trans_id: Date.now().toString(),
    cloud_id: cId,
    start_date: date,
    end_date: settings.shiftEnd < settings.shiftStart ? addDaysISO(date, 1) : date,
  };

  const response = await fetch('https://developer.fingerspot.io/api/get_attlog', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const resJson = await response.json();

  if (!resJson.success) {
    throw new Error(resJson.message || resJson.error_code || 'Fingerspot API request failed');
  }

  const rawData: Array<{
    pin: string;
    scan_date: string;
    verify: number;
    status_scan: number;
  }> = resJson.data || [];

  if (rawData.length === 0) {
    return { added: 0, total: 0, newPunchesCount: 0, savedRemotely: true, message: 'لا توجد حركات بصمة مسجلة في هذا اليوم' };
  }

  // Convert to AttendanceRecords (normalised so de-duplication keys always match)
  const newRecords: AttendanceRecord[] = rawData.map((d) => {
    const scanTime = normalizeScanTime(d.scan_date);
    return {
      id: `cloud-${d.pin}-${scanTime.replace(/[^0-9]/g, '')}`,
      pin: String(d.pin),
      scanTime,
      punchType: (['check_in', 'check_out', 'break_in', 'break_out', 'overtime_in', 'overtime_out'] as const)[d.status_scan] || 'check_in',
      verifyType: d.verify === 2 ? 'password' : 'fingerprint',
      deviceSn: cId,
      source: 'cloud_api',
    } as AttendanceRecord;
  });

  // Supabase is the source of truth. Existing rows are ignored, never overwritten.
  let savedRemotely = false;
  let remoteError = '';
  let insertedCount = 0;
  if (supabase) {
    const { data, error } = await (supabase as any).from('attendance_logs').upsert(
      newRecords.map((r) => ({
        pin: r.pin,
        scan_time: toFloatingIso(r.scanTime),
        punch_type: r.punchType,
        verify_type: r.verifyType,
        device_sn: r.deviceSn,
        source: 'cloud_api',
      })),
      { onConflict: 'pin,scan_time', ignoreDuplicates: true }
    ).select('id');
    insertedCount = data?.length ?? 0;
    if (error) remoteError = error.message;
    else savedRemotely = true;
  }

  // Only keep a local copy when the server did not confirm the save (offline protection)
  const addedLocal = savedRemotely ? 0 : addLocalLogs(newRecords);

  if (!savedRemotely) {
    return {
      savedRemotely: false,
      added: addedLocal,
      total: rawData.length,
      newPunchesCount: addedLocal,
      message: `تم استلام ${rawData.length} حركة لكن تعذّر الحفظ في النظام${remoteError ? ` (${remoteError})` : ''} — حُفظت مؤقتاً على هذا الجهاز فقط`,
    };
  }
  return {
    savedRemotely: true,
    added: insertedCount,
    total: rawData.length,
    newPunchesCount: insertedCount,
    message: `تم سحب ${rawData.length} حركة بصمة من السحابة وحفظها بنجاح!`,
  };
}

export function useSyncFingerspotCloud() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ date, token, cloudId }: { date: string; token: string; cloudId: string }) =>
      syncFingerspotCloud(date, token, cloudId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Manual & File Import
// ---------------------------------------------------------------------------

export async function addManualPunch(record: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
  const fullRecord: AttendanceRecord = {
    ...record,
    id: `manual-${Date.now()}`,
    scanTime: normalizeScanTime(record.scanTime),
    source: 'manual',
    verifyType: 'manual',
  };

  let saved = false;
  if (supabase) {
    const { error } = await (supabase as any).from('attendance_logs').upsert(
      {
        pin: fullRecord.pin,
        staff_id: fullRecord.staffId && !/^(custom|biometric)-/.test(fullRecord.staffId) ? fullRecord.staffId : null,
        staff_name: fullRecord.staffName,
        scan_time: toFloatingIso(fullRecord.scanTime),
        punch_type: fullRecord.punchType,
        verify_type: 'manual',
        device_sn: fullRecord.deviceSn || null,
        source: 'manual',
        notes: fullRecord.notes,
      },
      { onConflict: 'pin,scan_time', ignoreDuplicates: true }
    );
    if (error) console.warn('Supabase insert failed, keeping offline copy:', error.message);
    else saved = true;
  }
  if (!saved) addLocalLogs([fullRecord]);

  return fullRecord;
}

export function useAddManualPunch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (record: Omit<AttendanceRecord, 'id'>) => addManualPunch(record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-logs'] });
    },
  });
}

export function parseCSVAttendance(csvText: string): AttendanceRecord[] {
  const lines = csvText.trim().split(/\r?\n/);
  const records: AttendanceRecord[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Support tab separated, comma separated, or space separated
    const parts = line.split(/[,\t]+/).map((s) => s.trim().replace(/^["']|["']$/g, ''));
    if (parts.length < 2) continue;

    // Check if header line
    if (parts[0].toLowerCase().includes('pin') || parts[0].toLowerCase().includes('id') || parts[0].toLowerCase().includes('user')) {
      continue;
    }

    const pin = parts[0];
    const timeStr = parts[1]; // Expected "YYYY-MM-DD HH:mm:ss" or date + time in parts[1] and parts[2]
    let fullTime = timeStr;
    if (parts.length >= 3 && parts[2].includes(':') && !timeStr.includes(':')) {
      fullTime = `${timeStr} ${parts[2]}`;
    }

    if (pin && fullTime) {
      records.push({
        id: `csv-${pin}-${fullTime.replace(/[^0-9]/g, '')}`,
        pin: String(pin),
        scanTime: fullTime,
        punchType: 'check_in',
        verifyType: 'fingerprint',
        deviceSn: '616230026280266',
        source: 'usb_import',
      });
    }
  }

  return records;
}

// ---------------------------------------------------------------------------
// Daily Attendance Calculation Engine
// ---------------------------------------------------------------------------

export function calculateDailyAttendance(
  date: string,
  staffList: StaffMember[],
  punches: AttendanceRecord[],
  settings: AttendanceSettings
): DailyStaffAttendance[] {
  const window = attendanceWindow(date, settings);
  const seen = new Set<string>();
  punches = punches.map((p) => ({ ...p, pin: String(p.pin).trim(), scanTime: normalizeScanTime(p.scanTime) }))
    .filter((p) => {
      const key = `${p.pin}_${p.scanTime}`;
      if (!p.pin || !Number.isFinite(Date.parse(`${p.scanTime.replace(' ', 'T')}Z`)) || p.scanTime < window.start || p.scanTime >= window.end || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => a.scanTime.localeCompare(b.scanTime));
  // 1. Filter staff list to only active staff
  const activeStaff = (staffList || []).filter((s) => s.active !== false);

  // 2. Build complete roster: active PMS staff + custom biometric employees + any scanned PIN
  interface RosterMember {
    id: string;
    name: string;
    role: string;
    pin: string;
  }

  const roster: RosterMember[] = [];
  const assignedPins = new Set<string>();

  // Add active PMS staff that have an explicit biometric PIN mapping
  for (const s of activeStaff) {
    // Only explicit mappings are trusted: guessing a PIN would attribute punches to the wrong person.
    const pin = settings.pinMapping?.[s.id]?.trim();
    if (!pin || assignedPins.has(String(pin))) continue;
    assignedPins.add(String(pin));
    roster.push({
      id: s.id,
      name: s.full_name,
      role: s.role,
      pin: String(pin),
    });
  }

  // Add custom biometric employees from settings
  for (const entry of settings.customEmployees || []) {
    const ce = { ...entry, pin: entry.pin.trim() };
    if (ce.pin && !assignedPins.has(String(ce.pin))) {
      assignedPins.add(String(ce.pin));
      roster.push({
        id: `custom-${ce.pin}`,
        name: ce.name,
        role: ce.role || 'موظف',
        pin: String(ce.pin),
      });
    }
  }

  // Persisted staff_id wins over today's PIN mapping: reusing a PIN must not
  // move an old employee's attendance into a new employee's report.
  const punchesByEmployee = new Map<string, AttendanceRecord[]>();
  for (const p of punches) {
    let member = p.staffId ? roster.find((r) => r.id === p.staffId && r.pin === p.pin)
      : roster.find((r) => r.pin === p.pin);
    if (!member) {
      member = {
        id: p.staffId || `biometric-${p.pin}`,
        name: p.staffName || `موظف #${p.pin}`,
        role: 'موظف بصمة',
        pin: p.pin,
      };
      roster.push(member);
    }
    const key = `${member.id}:${member.pin}`;
    const list = punchesByEmployee.get(key) || [];
    if (p.staffName && list.length === 0) member.name = p.staffName;
    list.push(p);
    punchesByEmployee.set(key, list);
  }

  const results: DailyStaffAttendance[] = [];

  for (const member of roster) {
    const staffPunches = (punchesByEmployee.get(`${member.id}:${member.pin}`) || []).slice().sort((a, b) => a.scanTime.localeCompare(b.scanTime));

    let firstIn: string | null = null;
    let lastOut: string | null = null;
    let totalHours = 0;
    let lateMinutes = 0;
    let status: DailyStaffAttendance['status'] = 'absent';

    if (staffPunches.length > 0) {
      const stamp = (p: AttendanceRecord) => Date.parse(`${p.scanTime.replace(' ', 'T')}Z`);
      const timeOf = (p: AttendanceRecord) => p.scanTime.slice(11, 16);
      let first: AttendanceRecord | undefined;
      let last: AttendanceRecord | undefined;
      let workedMs = 0;
      let incomplete = false;

      if ((settings.calculationMode ?? 'first_last') === 'first_last') {
        // An untyped terminal supplies observations, not confirmed entry/exit events.
        first = staffPunches[0];
        const candidate = staffPunches[staffPunches.length - 1];
        const minimumGap = (settings.duplicateWindowMinutes ?? 5) * 60000;
        if (candidate !== first && stamp(candidate) - stamp(first) > minimumGap) {
          last = candidate;
          workedMs = stamp(last) - stamp(first);
        } else incomplete = true;
      } else {
        let open: AttendanceRecord | undefined;
        for (const p of staffPunches) {
          if (['check_in', 'break_in', 'overtime_in'].includes(p.punchType)) {
            if (p.punchType !== 'break_in') first ??= p;
            if (!open) open = p; // repeated entries do not create a departure
          } else {
            if (p.punchType !== 'break_out') last = p;
            if (open && stamp(p) >= stamp(open)) {
              workedMs += stamp(p) - stamp(open);
              open = undefined;
            } else incomplete = true;
          }
        }
        incomplete ||= !!open || !first || !last;
      }
      firstIn = first ? timeOf(first) : null;
      lastOut = last ? timeOf(last) : null;
      totalHours = Math.round(workedMs / 360000) / 10;
      status = 'present_on_time';
      if (first) {
        const expected = Date.parse(`${date}T${settings.shiftStart || '08:00'}:00Z`);
        const diff = Math.floor((stamp(first) - expected) / 60000);
        if (diff > settings.lateTolerance) { status = 'late'; lateMinutes = diff; }
      }
      if (last) {
        const endDate = settings.shiftEnd < settings.shiftStart ? addDaysISO(date, 1) : date;
        const expected = Date.parse(`${endDate}T${settings.shiftEnd || '16:00'}:00Z`);
        if (stamp(last) < expected - 15 * 60000 && status !== 'late') status = 'early_leave';
      }
      if (incomplete) status = 'incomplete';
    }

    results.push({
      staffId: member.id,
      staffName: member.name,
      role: member.role,
      pin: member.pin,
      date,
      firstIn,
      lastOut,
      totalHours,
      lateMinutes,
      status,
      punches: staffPunches,
    });
  }

  // Sort roster by PIN numerically
  results.sort((a, b) => {
    const na = parseInt(a.pin, 10);
    const nb = parseInt(b.pin, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.pin.localeCompare(b.pin);
  });

  return results;
}
