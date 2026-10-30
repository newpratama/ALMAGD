import { describe, expect, it } from 'vitest';
import {
  formatIDR,
  formatIDRWithCommas,
  formatNumberWithCommas,
  formatAmountWords,
  parseIDR,
} from './money';

describe('money utils', () => {
  it('formatIDR formats numbers as Indonesian Rupiah with thousand separators', () => {
    expect(formatIDR(3150000)).toMatch(/Rp\s*3\.150\.000/);
    expect(formatIDR(0)).toMatch(/Rp\s*0/);
    expect(formatIDR(500000)).toMatch(/Rp\s*500\.000/);
  });

  it('formatNumberWithCommas formats numbers with commas as thousands separators', () => {
    expect(formatNumberWithCommas(360000000)).toBe('360,000,000');
    expect(formatNumberWithCommas(1500000)).toBe('1,500,000');
    expect(formatNumberWithCommas(0)).toBe('0');
  });

  it('formatIDRWithCommas formats as Rp with commas', () => {
    expect(formatIDRWithCommas(360000000)).toBe('Rp 360,000,000');
    expect(formatIDRWithCommas(500000)).toBe('Rp 500,000');
    expect(formatIDRWithCommas(-50000)).toBe('-Rp 50,000');
  });

  it('formatAmountWords outputs correct verbal description in Arabic and Indonesian', () => {
    expect(formatAmountWords(360000000, 'ar')).toBe('360 مليون روبية');
    expect(formatAmountWords(360000000, 'id')).toBe('360 Juta Rupiah');
    expect(formatAmountWords(1500000, 'ar')).toBe('1.5 مليون روبية');
    expect(formatAmountWords(500000, 'ar')).toBe('500 ألف روبية');
    expect(formatAmountWords(0, 'ar')).toBe('0 روبية');
  });

  it('parseIDR extracts numeric value from formatted and raw strings', () => {
    expect(parseIDR('Rp 3.150.000')).toBe(3150000);
    expect(parseIDR('3150000')).toBe(3150000);
    expect(parseIDR('-Rp 50.000')).toBe(-50000);
    expect(parseIDR('-50000')).toBe(-50000);
    expect(parseIDR('')).toBe(0);
    expect(parseIDR('Rp 0')).toBe(0);
  });
});

