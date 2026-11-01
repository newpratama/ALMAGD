import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { StaffMember } from './staff';

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
  status: 'present_on_time' | 'late' | 'early_leave' | 'absent';
  punches: AttendanceRecord[];
}

const LOCAL_STORAGE_LOGS_KEY = 'almagd_attendance_logs_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'almagd_attendance_settings_v1';

export const DEFAULT_ATTENDANCE_SETTINGS: AttendanceSettings = {
  deviceIp: '192.168.1.201',
  devicePort: 4370,
  deviceSn: '616230026280266',
  cloudId: '616230026280266',
  apiToken: 'HENLQ0WVR7KVHXC3',
  shiftStart: '08:00',
  shiftEnd: '16:00',
  lateTolerance: 15,
  autoSync: true,
  pinMapping: {
    '601b35d5-484c-4ceb-9eef-668ffd2ec078': '1',
  },
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
        pinMapping: { ...DEFAULT_ATTENDANCE_SETTINGS.pinMapping, ...(parsed.pinMapping || {}) },
        customEmployees: parsed.customEmployees || [],
      };
    } catch {
      // ignore
    }
  }
  return DEFAULT_ATTENDANCE_SETTINGS;
}

export async function saveAttendanceSettings(settings: AttendanceSettings): Promise<AttendanceSettings> {
  localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));

  if (supabase) {
    try {
      await (supabase as any).from('attendance_settings').upsert({
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
        pin_mapping: settings.pinMapping,
        custom_employees: settings.customEmployees || [],
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not save settings to Supabase table, cached locally:', e);
    }
  }

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

export async function fetchAttendanceLogs(date: string): Promise<AttendanceRecord[]> {
  const startOfDay = `${date} 00:00:00`;
  const endOfDay = `${date} 23:59:59`;
  let logs: AttendanceRecord[] = [];

  // 1. Try Supabase
  if (supabase) {
    try {
      const { data, error } = await (supabase as any)
        .from('attendance_logs')
        .select('*')
        .gte('scan_time', startOfDay)
        .lte('scan_time', endOfDay)
        .order('scan_time', { ascending: true });

      if (!error && data) {
        logs = data.map((d: any) => ({
          id: d.id,
          pin: String(d.pin),
          staffId: d.staff_id,
          staffName: d.staff_name,
          scanTime: d.scan_time,
          punchType: d.punch_type || 'check_in',
          verifyType: d.verify_type || 'fingerprint',
          deviceSn: d.device_sn || '616230026280266',
          deviceIp: d.device_ip,
          source: d.source || 'biometric_sync',
          notes: d.notes,
          createdAt: d.created_at,
        }));
      }
    } catch {
      // Fall through to local cache
    }
  }

  // 2. Merge with local storage cache (for offline protection)
  try {
    const rawLocal = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    if (rawLocal) {
      const localList: AttendanceRecord[] = JSON.parse(rawLocal);
      const dayLogs = localList.filter((l) => (l.scanTime || '').startsWith(date));
      const existingKeys = new Set(logs.map((l) => `${l.pin}_${l.scanTime}`));
      for (const item of dayLogs) {
        if (!existingKeys.has(`${item.pin}_${item.scanTime}`)) {
          logs.push(item);
        }
      }
    }
  } catch {
    // ignore
  }

  logs.sort((a, b) => a.scanTime.localeCompare(b.scanTime));
  return logs;
}

export function useAttendanceLogs(date: string) {
  return useQuery({
    queryKey: ['attendance-logs', date],
    queryFn: () => fetchAttendanceLogs(date),
    refetchInterval: 1000 * 30, // 30s auto-refresh
  });
}

// ---------------------------------------------------------------------------
// Cloud Sync Integration (developer.fingerspot.io)
// ---------------------------------------------------------------------------

export async function syncFingerspotCloud(
  date: string,
  token?: string,
  cloudId?: string
): Promise<{ added: number; total: number; message: string; newPunchesCount: number }> {
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
    end_date: date,
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
    return { added: 0, total: 0, newPunchesCount: 0, message: 'لا توجد حركات بصمة مسجلة في هذا اليوم' };
  }

  // Convert to AttendanceRecords
  const newRecords: AttendanceRecord[] = rawData.map((d) => {
    const punchType = d.status_scan === 1 ? 'check_out' : 'check_in';
    const verifyType = d.verify === 2 ? 'password' : 'fingerprint';
    return {
      id: `cloud-${d.pin}-${d.scan_date.replace(/[^0-9]/g, '')}`,
      pin: String(d.pin),
      scanTime: d.scan_date,
      punchType,
      verifyType,
      deviceSn: cId,
      source: 'cloud_api',
    };
  });

  // Save to local storage
  try {
    const existingRaw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    const existingList: AttendanceRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    const keys = new Set(existingList.map((l) => `${l.pin}_${l.scanTime}`));
    let addedCount = 0;

    for (const r of newRecords) {
      if (!keys.has(`${r.pin}_${r.scanTime}`)) {
        existingList.push(r);
        keys.add(`${r.pin}_${r.scanTime}`);
        addedCount++;
      }
    }
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(existingList));

    // Try saving to Supabase if connected
    if (supabase) {
      const inserts = newRecords.map((r) => ({
        pin: r.pin,
        scan_time: r.scanTime,
        punch_type: r.punchType,
        verify_type: r.verifyType,
        device_sn: r.deviceSn,
        source: 'cloud_api',
      }));
      await (supabase as any).from('attendance_logs').upsert(inserts, { onConflict: 'pin,scan_time' });
    }

    return {
      added: addedCount,
      total: rawData.length,
      newPunchesCount: addedCount,
      message: `تم سحب ${rawData.length} حركة بصمة من السحابة بنجاح!`,
    };
  } catch (err: any) {
    return { added: newRecords.length, total: rawData.length, newPunchesCount: newRecords.length, message: `تم الاستلام: ${rawData.length}` };
  }
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
  const newId = `manual-${Date.now()}`;
  const fullRecord: AttendanceRecord = {
    ...record,
    id: newId,
    source: 'manual',
    verifyType: 'manual',
  };

  // Local storage
  try {
    const existingRaw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    const list: AttendanceRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    list.push(fullRecord);
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  // Supabase
  if (supabase) {
    try {
      await (supabase as any).from('attendance_logs').insert({
        pin: fullRecord.pin,
        staff_id: fullRecord.staffId,
        staff_name: fullRecord.staffName,
        scan_time: fullRecord.scanTime,
        punch_type: fullRecord.punchType,
        verify_type: 'manual',
        device_sn: fullRecord.deviceSn || '616230026280266',
        source: 'manual',
        notes: fullRecord.notes,
      });
    } catch (e) {
      console.warn('Supabase insert failed, saved to local cache:', e);
    }
  }

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

  // Add active PMS staff (e.g. omar)
  for (const s of activeStaff) {
    let pin = settings.pinMapping?.[s.id];
    if (!pin) {
      if (s.full_name.toLowerCase().includes('omar')) {
        pin = '1';
      } else {
        pin = String(roster.length + 1);
      }
    }
    assignedPins.add(String(pin));
    roster.push({
      id: s.id,
      name: s.full_name,
      role: s.role,
      pin: String(pin),
    });
  }

  // Add custom biometric employees from settings
  for (const ce of settings.customEmployees || []) {
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

  // Group punches by PIN
  const punchesByPin = new Map<string, AttendanceRecord[]>();
  for (const p of punches) {
    const pinStr = String(p.pin);
    const arr = punchesByPin.get(pinStr) || [];
    arr.push(p);
    punchesByPin.set(pinStr, arr);
  }

  // Include any PIN scanned today that is not yet in roster
  for (const pinStr of punchesByPin.keys()) {
    if (!assignedPins.has(pinStr)) {
      assignedPins.add(pinStr);
      const fallbackName = pinStr === '1' ? 'omar' : `موظف #${pinStr}`;
      roster.push({
        id: `biometric-${pinStr}`,
        name: fallbackName,
        role: 'موظف بصمة',
        pin: pinStr,
      });
    }
  }

  const results: DailyStaffAttendance[] = [];

  for (const member of roster) {
    const staffPunches = (punchesByPin.get(member.pin) || []).slice().sort((a, b) => a.scanTime.localeCompare(b.scanTime));

    let firstIn: string | null = null;
    let lastOut: string | null = null;
    let totalHours = 0;
    let lateMinutes = 0;
    let status: DailyStaffAttendance['status'] = 'absent';

    if (staffPunches.length > 0) {
      // First punch is check-in
      const firstPunch = staffPunches[0];
      const timePart = firstPunch.scanTime.split(' ')[1] || firstPunch.scanTime.slice(11, 16);
      firstIn = timePart.slice(0, 5); // "08:10"

      // If more than 1 punch, last punch is check-out
      if (staffPunches.length > 1) {
        const lastPunch = staffPunches[staffPunches.length - 1];
        const lastTimePart = lastPunch.scanTime.split(' ')[1] || lastPunch.scanTime.slice(11, 16);
        lastOut = lastTimePart.slice(0, 5);

        // Compute hours between firstIn and lastOut
        try {
          const dIn = new Date(`${date}T${firstIn}:00`);
          const dOut = new Date(`${date}T${lastOut}:00`);
          const diffMs = Math.max(0, dOut.getTime() - dIn.getTime());
          totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
        } catch {
          totalHours = 0;
        }
      }

      // Check punctuality against shiftStart (e.g. "08:00") + lateTolerance (e.g. 15 mins)
      const [startHour, startMin] = (settings.shiftStart || '08:00').split(':').map(Number);
      const [inHour, inMin] = firstIn.split(':').map(Number);
      const shiftStartMinutes = startHour * 60 + startMin;
      const actualInMinutes = inHour * 60 + inMin;
      const diff = actualInMinutes - shiftStartMinutes;

      if (diff > settings.lateTolerance) {
        status = 'late';
        lateMinutes = diff;
      } else {
        status = 'present_on_time';
        lateMinutes = 0;
      }

      // Check if left early
      if (lastOut) {
        const [endHour, endMin] = (settings.shiftEnd || '16:00').split(':').map(Number);
        const [outHour, outMin] = lastOut.split(':').map(Number);
        const shiftEndMinutes = endHour * 60 + endMin;
        const actualOutMinutes = outHour * 60 + outMin;
        if (actualOutMinutes < shiftEndMinutes - 15) {
          if (status !== 'late') status = 'early_leave';
        }
      }
    } else {
      status = 'absent';
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
