import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { arSA, id as idLocale } from 'date-fns/locale';

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

export function formatDateHuman(d: ISODate, locale: 'id' | 'ar'): string {
  const parsed = parseISO(d);
  if (locale === 'ar') {
    return format(parsed, 'EEEE, d MMMM yyyy', { locale: arSA });
  }
  return format(parsed, 'EEE, d MMM yyyy', { locale: idLocale });
}

export function excelSerialToISO(serial: number): ISODate {
  return new Date(Date.UTC(1899, 11, 30) + serial * 86400000).toISOString().slice(0, 10);
}
