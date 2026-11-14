import { describe, expect, it } from 'vitest';
import { id } from './id';
import { ar } from './ar';

const sourceFiles = import.meta.glob(
  ['../**/*.ts', '../**/*.tsx', '!../**/*.test.ts', '!../**/*.test.tsx'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

function getLeafEntries(obj: Record<string, unknown>, prefix = ''): Array<[string, string]> {
  let entries: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries = entries.concat(getLeafEntries(value as Record<string, unknown>, fullKey));
    } else {
      entries.push([fullKey, String(value)]);
    }
  }
  return entries;
}

function getLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return getLeafEntries(obj, prefix).map(([k]) => k);
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

  it('matching interpolation placeholders between ar and id', () => {
    const idMap = new Map(getLeafEntries(id as Record<string, unknown>));
    const arMap = new Map(getLeafEntries(ar as Record<string, unknown>));
    const mismatches: string[] = [];

    const extractVars = (str: string) =>
      Array.from(str.matchAll(/\{(\w+)\}/g), (m) => m[1]).sort();

    for (const [key, idVal] of idMap) {
      const arVal = arMap.get(key) ?? '';
      const idVars = extractVars(idVal);
      const arVars = extractVars(arVal);
      if (idVars.join(',') !== arVars.join(',')) {
        mismatches.push(`${key}: id=[${idVars.join(',')}] ar=[${arVars.join(',')}]`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('every static t(...) key used in src exists in both ar and id', () => {
    const keySet = new Set(getLeafKeys(id as Record<string, unknown>));
    const missingUsedKeys: string[] = [];
    const callRe = /\bt\(\s*['"]([a-zA-Z0-9_.]+)['"]/g;
    const files = Object.entries(sourceFiles);
    expect(files.length).toBeGreaterThan(0);

    for (const [file, content] of files) {
      let match: RegExpExecArray | null;
      while ((match = callRe.exec(content)) !== null) {
        if (!keySet.has(match[1])) {
          missingUsedKeys.push(`${file} -> ${match[1]}`);
        }
      }
    }

    expect(missingUsedKeys).toEqual([]);
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
