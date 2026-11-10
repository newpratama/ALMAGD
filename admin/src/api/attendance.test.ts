import { describe, expect, it, vi } from 'vitest';
import { supabase } from '../lib/supabase';
import {
  calculateDailyAttendance,
  fetchAttendanceLogs,
  normalizeScanTime,
  attendanceWindow,
  validateAttendanceSettings,
  DEFAULT_ATTENDANCE_SETTINGS,
  type AttendanceRecord,
} from './attendance';
import type { StaffMember } from './staff';

const punch = (pin: string, scanTime: string, punchType: AttendanceRecord['punchType'] = 'check_in'): AttendanceRecord => ({
  id: `${pin}-${scanTime}`,
  pin,
  scanTime,
  punchType,
  verifyType: 'fingerprint',
  deviceSn: 'x',
  source: 'biometric_sync',
});

const staff = (id: string, name: string): StaffMember =>
  ({ id, full_name: name, role: 'reception', active: true }) as unknown as StaffMember;

describe('normalizeScanTime', () => {
  it('makes server, device and cloud formats identical', () => {
    const a = normalizeScanTime('2026-11-01T08:05:00+00:00');
    const b = normalizeScanTime('2026-11-01 08:05:00');
    const c = normalizeScanTime('2026-11-01T08:05:00.123Z');
    expect(a).toBe('2026-11-01 08:05:00');
    expect(b).toBe(a);
    expect(c).toBe(a);
  });
});

describe('calculateDailyAttendance', () => {
  const settings = { ...DEFAULT_ATTENDANCE_SETTINGS, pinMapping: { s1: '1' }, customEmployees: [], calculationMode: 'explicit' as const };

  it('does not guess a PIN for staff without an explicit mapping', () => {
    const rows = calculateDailyAttendance(
      '2026-11-01',
      [staff('s1', 'Ali'), staff('s2', 'Budi')],
      [punch('2', '2026-11-01 08:00:00')],
      settings
    );
    const budi = rows.find((r) => r.staffId === 's2');
    expect(budi).toBeUndefined(); // unmapped staff are not tracked
    expect(rows.find((r) => r.pin === '1')?.staffName).toBe('Ali');
    expect(rows.find((r) => r.pin === '2')?.staffName).toBe('موظف #2'); // unknown PIN surfaced, not misattributed
  });

  it('computes hours and lateness from normalised punches', () => {
    const rows = calculateDailyAttendance(
      '2026-11-01',
      [staff('s1', 'Ali')],
      [punch('1', '2026-11-01 08:30:00'), punch('1', '2026-11-01 16:00:00', 'check_out')],
      settings
    );
    expect(rows[0].firstIn).toBe('08:30');
    expect(rows[0].lastOut).toBe('16:00');
    expect(rows[0].totalHours).toBe(7.5);
    expect(rows[0].status).toBe('late');
  });
});


describe('attendance identity and punch correctness', () => {
  const settings = { ...DEFAULT_ATTENDANCE_SETTINGS, pinMapping: { s1: '1' }, customEmployees: [], calculationMode: 'explicit' as const };
  const calculate = (logs: AttendanceRecord[]) => calculateDailyAttendance('2026-11-01', [staff('s1', 'Ali')], logs, settings)[0];

  it('never treats a repeated check-in as a check-out', () => {
    const row = calculate([punch('1', '2026-11-01 08:00:00'), punch('1', '2026-11-01 08:01:00')]);
    expect(row.firstIn).toBe('08:00');
    expect(row.lastOut).toBeNull();
    expect(row.totalHours).toBe(0);
  });

  it('never treats an isolated check-out as a check-in', () => {
    const row = calculate([punch('1', '2026-11-01 16:00:00', 'check_out')]);
    expect(row.firstIn).toBeNull();
    expect(row.lastOut).toBe('16:00');
    expect(row.status).toBe('incomplete');
  });

  it('subtracts breaks and does not count duplicate scans twice', () => {
    const row = calculate([
      punch('1', '2026-11-01 08:00:00'), punch('1', '2026-11-01 08:00:00'),
      punch('1', '2026-11-01 12:00:00', 'break_out'),
      punch('1', '2026-11-01 13:00:00', 'break_in'),
      punch('1', '2026-11-01 16:00:00', 'check_out'),
    ]);
    expect(row.totalHours).toBe(7);
    expect(row.punches).toHaveLength(4);
  });

  it('ignores other dates and normalizes ISO scan timestamps before calculation', () => {
    const row = calculate([punch('1', '2026-10-31 07:00:00'), punch('1', '2026-11-01T08:00:00+00:00'), punch('1', '2026-11-01T16:00:00+00:00', 'check_out')]);
    expect(row.firstIn).toBe('08:00');
    expect(row.lastOut).toBe('16:00');
    expect(row.totalHours).toBe(8);
    expect(row.punches).toHaveLength(2);
  });

  it('uses the saved identity for a historical scan when the current mapping changed', () => {
    const logs = [{ ...punch('7', '2026-11-01 08:00:00'), staffId: 's-old', staffName: 'Historical Employee' }];
    const rows = calculateDailyAttendance('2026-11-01', [], logs, { ...settings, pinMapping: {}, customEmployees: [] });
    expect(rows[0].staffId).toBe('s-old');
    expect(rows[0].staffName).toBe('Historical Employee');
  });
});


describe('scan-only terminal and night shift', () => {
  const settings = { ...DEFAULT_ATTENDANCE_SETTINGS, pinMapping: { s1: '1' }, customEmployees: [] };
  const rows = (logs: AttendanceRecord[], overrides = {}) => calculateDailyAttendance('2026-11-01', [staff('s1', 'Ali')], logs, { ...settings, ...overrides });
  it('infers first and last observations without trusting the terminal movement flag', () => {
    const row = rows([punch('1', '2026-11-01 08:00:00'), punch('1', '2026-11-01 16:00:00')])[0];
    expect(row.firstIn).toBe('08:00');
    expect(row.lastOut).toBe('16:00');
    expect(row.totalHours).toBe(8);
  });
  it('flags nearby repeated observations as incomplete instead of a departure', () => {
    const row = rows([punch('1', '2026-11-01 08:00:00'), punch('1', '2026-11-01 08:02:00')])[0];
    expect(row.lastOut).toBeNull();
    expect(row.status).toBe('incomplete');
  });
  it('assigns a next-morning departure to the night shift start date', () => {
    const night = { shiftStart: '22:00', shiftEnd: '06:00' };
    expect(attendanceWindow('2026-11-01', night)).toEqual({ start: '2026-11-01 14:00:00', end: '2026-11-02 14:00:00' });
    const row = rows([punch('1', '2026-11-01 22:00:00'), punch('1', '2026-11-02 06:00:00')], night)[0];
    expect(row.firstIn).toBe('22:00');
    expect(row.lastOut).toBe('06:00');
    expect(row.totalHours).toBe(8);
    expect(row.status).toBe('present_on_time');
  });
  it('does not reattribute a saved staff ID when its PIN is reassigned', () => {
    const records = [{ ...punch('1', '2026-11-01 08:00:00'), staffId: 'former', staffName: 'Former employee' }];
    const result = rows(records);
    expect(result.find((r) => r.staffId === 's1')?.punches).toHaveLength(0);
    expect(result.find((r) => r.staffId === 'former')?.staffName).toBe('Former employee');
  });
  it('rejects ambiguous PINs across staff and custom employees', () => {
    expect(() => validateAttendanceSettings({ ...settings, customEmployees: [{ pin: '1', name: 'Other' }] })).toThrow();
    expect(() => validateAttendanceSettings({ ...settings, pinMapping: { s1: '1', s2: ' 1 ' } })).toThrow();
  });
  it('preserves leading zeros in PINs and supports custom employee names', () => {
    const result = rows([punch('001', '2026-11-01 08:00:00')], { pinMapping: {}, customEmployees: [{ pin: '001', name: 'Cleaner' }] });
    expect(result[0].pin).toBe('001');
    expect(result[0].staffName).toBe('Cleaner');
    expect(result[0].staffId).toBe('custom-001');
  });
});


describe('attendance retrieval', () => {
  it('retrieves more than 1000 movements instead of silently truncating the day', async () => {
    const raw = Array.from({ length: 1001 }, (_, i) => ({ id: `record-${i}`, pin: String(i), scan_time: '2026-11-01T08:00:00Z' }));
    const query: any = {};
    for (const method of ['select', 'gte', 'lt', 'order']) query[method] = vi.fn(() => query);
    query.range = vi.fn(async (start: number, end: number) => ({ data: raw.slice(start, end + 1), error: null }));
    const spy = vi.spyOn(supabase as any, 'from').mockReturnValue(query);
    try {
      const result = await fetchAttendanceLogs('2026-11-01');
      expect(result).toHaveLength(1001);
      expect(query.range).toHaveBeenNthCalledWith(1, 0, 999);
      expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    } finally { spy.mockRestore(); }
  });
  it('propagates a failed server read instead of returning an empty attendance roster', async () => {
    const query: any = {};
    for (const method of ['select', 'gte', 'lt', 'order']) query[method] = vi.fn(() => query);
    query.range = vi.fn(async () => ({ data: null, error: new Error('offline') }));
    const spy = vi.spyOn(supabase as any, 'from').mockReturnValue(query);
    try { await expect(fetchAttendanceLogs('2026-11-01')).rejects.toThrow('offline'); }
    finally { spy.mockRestore(); }
  });
});
