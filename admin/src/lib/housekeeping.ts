import { broadcastDataChange } from './broadcast';

export type HousekeepingStatus = 'clean' | 'cleaning' | 'dirty';

export interface UnitHousekeepingRecord {
  unitId: number;
  status: HousekeepingStatus;
  updatedAt: string;
  notes?: string;
}

const STORAGE_KEY = 'almagd_housekeeping_v1';

export function getHousekeepingMap(): Record<number, UnitHousekeepingRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function getUnitHousekeeping(unitId: number): HousekeepingStatus {
  const map = getHousekeepingMap();
  return map[unitId]?.status || 'clean';
}

export function setUnitHousekeepingStatus(
  unitId: number,
  status: HousekeepingStatus,
  notes?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getHousekeepingMap();
    map[unitId] = {
      unitId,
      status,
      updatedAt: new Date().toISOString(),
      notes,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    broadcastDataChange('units');
    window.dispatchEvent(new Event('almagd-housekeeping-updated'));
  } catch (e) {
    console.error('Failed to update housekeeping status', e);
  }
}

export function cycleHousekeepingStatus(unitId: number): HousekeepingStatus {
  const current = getUnitHousekeeping(unitId);
  let next: HousekeepingStatus;
  if (current === 'dirty') {
    next = 'cleaning';
  } else if (current === 'cleaning') {
    next = 'clean';
  } else {
    next = 'dirty';
  }
  setUnitHousekeepingStatus(unitId, next);
  return next;
}
