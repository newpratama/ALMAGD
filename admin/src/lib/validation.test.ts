import { describe, expect, it } from 'vitest';
import {
  formatMissingFieldsMessage,
  isValidHexColor,
  isValidUUID,
} from './validation';
import { ar } from '../i18n/ar';
import { id } from '../i18n/id';

function makeTranslator(dict: Record<string, Record<string, string>>) {
  return (key: string, params?: Record<string, string | number>): string => {
    const [ns, k] = key.split('.');
    let str = dict[ns]?.[k] ?? key;
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
    }
    return str;
  };
}

describe('validation utilities', () => {
  it('formats Arabic warning listing all incomplete fields and extra details', () => {
    const t = makeTranslator(ar as unknown as Record<string, Record<string, string>>);
    const msg = formatMissingFieldsMessage(
      [ar.booking.guest, ar.booking.unit, ar.booking.guest],
      t,
      [ar.booking.invalidDates]
    );
    expect(msg).toContain(ar.booking.guest);
    expect(msg).toContain(ar.booking.unit);
    expect(msg).toContain(ar.booking.invalidDates);
    expect(msg).toBe(
      `يرجى إكمال الحقول الناقصة: الضيف، الوحدة — ${ar.booking.invalidDates}`
    );
  });

  it('formats Indonesian warning cleanly when only extra details exist', () => {
    const t = makeTranslator(id as unknown as Record<string, Record<string, string>>);
    const msg = formatMissingFieldsMessage([], t, [id.booking.invalidDates]);
    expect(msg).toBe(id.booking.invalidDates);
  });

  it('validates UUID and Hex colors', () => {
    expect(isValidUUID('11111111-2222-3333-4444-555555555555')).toBe(true);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidHexColor('#536275')).toBe(true);
    expect(isValidHexColor('#FFF')).toBe(false);
    expect(isValidHexColor('536275')).toBe(false);
  });
});
