import { differenceInCalendarDays, parseISO } from 'date-fns';

export const OTA_SOURCES = ['tiket', 'booking', 'agoda', 'traveloka'] as const;

export function isOtaSource(sourceCode: string | null | undefined): boolean {
  if (!sourceCode) return false;
  return OTA_SOURCES.includes(sourceCode.toLowerCase() as any);
}

export function formatLeadTime(checkInDate: string | null | undefined, baseDate: string, lang: 'id' | 'ar'): string | null {
  if (!checkInDate) return null;
  try {
    const days = differenceInCalendarDays(parseISO(checkInDate), parseISO(baseDate));
    if (days <= 0) return null;
    
    if (lang === 'ar') {
      if (days === 1) return 'غداً';
      if (days === 2) return 'بعد يومين';
      if (days >= 3 && days <= 10) return `بعد ${days} أيام`;
      if (days >= 11 && days <= 16) return 'بعد أسبوعين تقريباً';
      if (days >= 17 && days <= 24) return 'بعد 3 أسابيع';
      if (days >= 25 && days <= 35) return 'بعد شهر';
      return `بعد ${days} يوماً`;
    }

    if (days === 1) return 'Besok';
    if (days === 2) return 'Lusa';
    if (days === 7) return '1 minggu lagi';
    if (days === 14) return '2 minggu lagi';
    return `Dalam ${days} hari`;
  } catch {
    return null;
  }
}
