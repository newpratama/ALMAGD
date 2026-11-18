import { describe, expect, it } from 'vitest';
import {
  formatIDR,
  formatIDRWithCommas,
  formatNumberWithCommas,
  formatAmountWords,
  parseIDR,
  calcOtaNetPayout,
  invertOtaNetPayout,
  extractOtaVoucherFromNotes,
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

  it('calcOtaNetPayout and invertOtaNetPayout round-trip accurately without double deduction', () => {
    for (const voucher of [0, 500000, 1000000, 1166771, 1452500, 3500000]) {
      const calc = calcOtaNetPayout(voucher);
      const inverted = invertOtaNetPayout(calc.netPayout);
      expect(calcOtaNetPayout(inverted).netPayout).toBe(calc.netPayout);
    }

    // Direct net payout value (like 1,302,267 from screenshot) also inverts cleanly
    const invertedSample = invertOtaNetPayout(1302267);
    expect(Math.abs(calcOtaNetPayout(invertedSample).netPayout - 1302267)).toBeLessThanOrEqual(1);
  });

  it('extractOtaVoucherFromNotes extracts valid voucher and ignores stale or bogus lines', () => {
    const validCalc = calcOtaNetPayout(1452500);
    const notesWithValid = `[سند Agoda: المبلغ الاسمي Rp 1,452,500 | الصافي للبنك ${formatIDRWithCommas(validCalc.netPayout)}]`;
    expect(extractOtaVoucherFromNotes(notesWithValid, validCalc.netPayout)).toBe(1452500);
    expect(extractOtaVoucherFromNotes(notesWithValid, 999999)).toBeNull();

    // Bogus line where voucher == recordedNet (from earlier double-deduction bug) must be ignored
    const bogusNotes = `[سند Agoda: المبلغ الاسمي Rp 1,302,267 | الصافي للبنك Rp 1,302,267]`;
    expect(extractOtaVoucherFromNotes(bogusNotes, 1302267)).toBeNull();
  });
});

