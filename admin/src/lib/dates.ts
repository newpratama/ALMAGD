import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export type ISODate = string; // 'YYYY-MM-DD'

export function todayISO(): ISODate {
  return format(new Date(), 'yyyy-MM-dd');
}

export function addDaysISO(d: ISODate, n: number): ISODate {
  const parsed = parseISO(d);
  return format(addDays(parsed, n), 'yyyy-MM-dd');
}

export function nightsBetween(checkIn: ISODate, checkOut: ISODate): number {
  return differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
}

export function eachNight(checkIn: ISODate, checkOut: ISODate): ISODate[] {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) return [];
  const result: ISODate[] = [];
  let curr = checkIn;
  for (let i = 0; i < nights; i++) {
    result.push(curr);
    curr = addDaysISO(curr, 1);
  }
  return result;
}

export function parseDateRange(r: string): { start: ISODate; end: ISODate } {
  const match = r.match(/(\d{4}-\d{2}-\d{2})\s*,\s*(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    throw new Error(`Invalid date range format: ${r}`);
  }
  return { start: match[1], end: match[2] };
}

/**
 * Validate that (year, month, day) form a real calendar date and return ISO YYYY-MM-DD.
 */
function buildValidatedISO(year: number, month: number, day: number): ISODate | null {
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Format an ISO date string into consistent numeric DD/MM/YYYY digits
 * (day on left, month in middle, year at end) without localized letters.
 */
export function formatDateHuman(d: ISODate, _locale?: 'id' | 'ar'): string {
  if (!d) return '—';
  const parsed = parseISO(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return format(parsed, 'dd/MM/yyyy');
}

/**
 * Format an ISO date string into compact DD/MM numeric digits for charts and stay badges.
 */
export function formatShortDateNumeric(d: ISODate): string {
  if (!d) return '—';
  const parsed = parseISO(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return format(parsed, 'dd/MM');
}

/**
 * Format an ISO timestamp into consistent numeric DD/MM/YYYY HH:mm digits.
 */
export function formatDateTimeNumeric(iso: string): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return format(parsed, 'dd/MM/yyyy HH:mm');
}

/**
 * Convert an ISO date ('YYYY-MM-DD') to display format ('DD/MM/YYYY') for date inputs.
 */
export function formatDateInputValue(d: ISODate): string {
  if (!d) return '';
  const match = d.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const valid = buildValidatedISO(Number(match[1]), Number(match[2]), Number(match[3]));
    if (valid) return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const parsed = parseISO(d);
  if (Number.isNaN(parsed.getTime())) return '';
  return format(parsed, 'dd/MM/yyyy');
}

/**
 * Parse a user-typed date string ('DD/MM/YYYY', 'DD-MM-YYYY', 'DD.MM.YYYY',
 * 8-digit 'DDMMYYYY', or ISO 'YYYY-MM-DD') into canonical ISO 'YYYY-MM-DD'.
 */
export function parseDateInputToISO(raw: string): ISODate | null {
  const trimmed = raw.trim().replace(/\s+/g, '');
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return buildValidatedISO(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  if (dmyMatch) {
    return buildValidatedISO(Number(dmyMatch[3]), Number(dmyMatch[2]), Number(dmyMatch[1]));
  }

  const compactMatch = trimmed.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (compactMatch) {
    return buildValidatedISO(
      Number(compactMatch[3]),
      Number(compactMatch[2]),
      Number(compactMatch[1])
    );
  }

  return null;
}

export function excelSerialToISO(serial: number): ISODate {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 10);
}
