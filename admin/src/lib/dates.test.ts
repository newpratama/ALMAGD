import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  eachNight,
  excelSerialToISO,
  formatDateHuman,
  formatDateInputValue,
  formatDateTimeNumeric,
  formatShortDateNumeric,
  nightsBetween,
  parseDateInputToISO,
  parseDateRange,
  todayISO,
} from './dates';

describe('dates utils', () => {
  it('todayISO returns YYYY-MM-DD format', () => {
    const today = todayISO();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('addDaysISO correctly adds and subtracts days', () => {
    expect(addDaysISO('2026-10-01', 3)).toBe('2026-10-04');
    expect(addDaysISO('2026-10-01', -1)).toBe('2026-09-30');
    expect(addDaysISO('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('nightsBetween calculates difference in days', () => {
    expect(nightsBetween('2026-10-01', '2026-10-04')).toBe(3);
    expect(nightsBetween('2026-10-04', '2026-10-01')).toBe(-3);
    expect(nightsBetween('2026-10-01', '2026-10-01')).toBe(0);
  });

  it('eachNight returns array of nights excluding checkOut', () => {
    expect(eachNight('2026-10-01', '2026-10-04')).toEqual([
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]);
    expect(eachNight('2026-10-01', '2026-10-01')).toEqual([]);
    expect(eachNight('2026-10-02', '2026-10-01')).toEqual([]);
  });

  it('parseDateRange parses PostgreSQL daterange notation', () => {
    expect(parseDateRange('[2026-10-01,2026-10-04)')).toEqual({
      start: '2026-10-01',
      end: '2026-10-04',
    });
  });

  it('formatDateHuman formats dates consistently as numeric DD/MM/YYYY without letters', () => {
    const idFormatted = formatDateHuman('2026-10-24', 'id');
    expect(idFormatted).toBe('24/10/2026');

    const arFormatted = formatDateHuman('2026-10-24', 'ar');
    expect(arFormatted).toBe('24/10/2026');
    expect(arFormatted).not.toMatch(/[أ-يa-zA-Z]/);
    expect(formatDateHuman('', 'ar')).toBe('—');
  });

  it('formatShortDateNumeric formats compact dates as DD/MM', () => {
    expect(formatShortDateNumeric('2026-11-14')).toBe('14/11');
    expect(formatShortDateNumeric('')).toBe('—');
  });

  it('formatDateTimeNumeric formats timestamps consistently in numeric DD/MM/YYYY HH:mm', () => {
    const formatted = formatDateTimeNumeric('2026-10-24T09:15:00Z');
    expect(formatted).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
    expect(formatDateTimeNumeric('')).toBe('—');
  });

  it('formatDateInputValue and parseDateInputToISO convert between ISO and DD/MM/YYYY', () => {
    expect(formatDateInputValue('2026-11-14')).toBe('14/11/2026');
    expect(formatDateInputValue('')).toBe('');

    expect(parseDateInputToISO('14/11/2026')).toBe('2026-11-14');
    expect(parseDateInputToISO('14 / 11 / 2026')).toBe('2026-11-14');
    expect(parseDateInputToISO('14-11-2026')).toBe('2026-11-14');
    expect(parseDateInputToISO('5/4/2026')).toBe('2026-04-05');
    expect(parseDateInputToISO('14112026')).toBe('2026-11-14');
    expect(parseDateInputToISO('2026-11-14')).toBe('2026-11-14');

    // Invalid calendar dates must be rejected
    expect(parseDateInputToISO('31/02/2026')).toBeNull();
    expect(parseDateInputToISO('14/13/2026')).toBeNull();
    expect(parseDateInputToISO('14/11')).toBeNull();
  });

  it('excelSerialToISO converts Excel serial number to ISO date', () => {
    expect(excelSerialToISO(46296)).toBe('2026-10-01');
  });
});
