import { describe, expect, it } from 'vitest';
import { id } from './id';
import { ar } from './ar';

function getLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys = keys.concat(getLeafKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe('i18n key parity', () => {
  it('ar and id dictionaries have exactly the same keys', () => {
    const idKeys = getLeafKeys(id as Record<string, unknown>).sort();
    const arKeys = getLeafKeys(ar as Record<string, unknown>).sort();

    const missingInAr = idKeys.filter((k) => !arKeys.includes(k));
    const extraInAr = arKeys.filter((k) => !idKeys.includes(k));

    expect(missingInAr).toEqual([]);
    expect(extraInAr).toEqual([]);
    expect(idKeys).toEqual(arKeys);
  });

  it('no empty translation strings', () => {
    const checkNoEmpty = (obj: Record<string, unknown>, name: string) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          expect(value.trim().length, `empty string at ${name}.${key}`).toBeGreaterThan(0);
        } else if (value && typeof value === 'object') {
          checkNoEmpty(value as Record<string, unknown>, `${name}.${key}`);
        }
      }
    };

    checkNoEmpty(id as Record<string, unknown>, 'id');
    checkNoEmpty(ar as Record<string, unknown>, 'ar');
  });

  it('matches required glossary terms', () => {
    expect(id.booking.code).toContain('Booking');
    expect(ar.nav.bookings).toBe('الحجوزات');
    expect(ar.common.save).toBe('حفظ');
    expect(id.stats.occupancy).toBe('Hunian');
    expect(ar.stats.occupancy).toBe('الإشغال');
  });
});
