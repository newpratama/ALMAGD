import { differenceInCalendarDays, parseISO } from 'date-fns';
import {
  extractOtaVoucherFromNotes,
  formatIDRWithCommas,
  invertOtaNetPayout,
} from './money';

export const OTA_SOURCES = ['tiket', 'booking', 'agoda', 'traveloka'] as const;
export const OTA_COMMISSIONABLE_SOURCES = ['booking', 'agoda'] as const;

export type OtaEntryMode = 'commissionable' | 'net';

export function isOtaSource(sourceCode: string | null | undefined): boolean {
  if (!sourceCode) return false;
  return OTA_SOURCES.includes(sourceCode.toLowerCase() as any);
}

export function isOtaCommissionableSource(sourceCode: string | null | undefined): boolean {
  if (!sourceCode) return false;
  return OTA_COMMISSIONABLE_SOURCES.includes(sourceCode.toLowerCase() as any);
}

export interface InitialBookingPricingState {
  otaEntryMode: OtaEntryMode;
  commissionableInput: number;
  totalAmount: number;
  pricePerNight: number;
}

/**
 * Computes initial OTA/pricing state for `BookingForm`.
 * In edit mode (`initialBooking` provided), `total_amount` in DB is already the saved
 * net bank amount, so `otaEntryMode` always defaults to `'net'` to prevent double deduction.
 */
export function getInitialBookingPricingState(
  initialBooking?: {
    source_code?: string | null;
    total_amount?: number | null;
    notes?: string | null;
    check_in?: string | null;
    check_out?: string | null;
  } | null,
  defaultAmount = 1000000
): InitialBookingPricingState {
  if (!initialBooking) {
    return {
      otaEntryMode: 'net',
      commissionableInput: defaultAmount,
      totalAmount: defaultAmount,
      pricePerNight: defaultAmount,
    };
  }

  const savedTotal = Math.max(0, Math.round(Number(initialBooking.total_amount ?? 0)));
  const isCommissionable = isOtaCommissionableSource(initialBooking.source_code);

  let nights = 1;
  if (
    initialBooking.check_in &&
    initialBooking.check_out &&
    initialBooking.check_out > initialBooking.check_in
  ) {
    try {
      const diff = differenceInCalendarDays(
        parseISO(initialBooking.check_out),
        parseISO(initialBooking.check_in)
      );
      if (diff >= 1) nights = diff;
    } catch {
      nights = 1;
    }
  }

  const commissionableInput = isCommissionable
    ? extractOtaVoucherFromNotes(initialBooking.notes, savedTotal) ??
      invertOtaNetPayout(savedTotal)
    : savedTotal;

  return {
    otaEntryMode: 'net',
    commissionableInput,
    totalAmount: savedTotal,
    pricePerNight: Math.round(savedTotal / nights),
  };
}

/**
 * Builds final booking notes, appending an OTA voucher audit trail only when
 * creating a commissionable OTA booking or when editing and changing the net amount
 * via commissionable mode (never duplicating identical audit lines).
 */
export function buildBookingFinalNotes(params: {
  rawNotes: string;
  isEdit: boolean;
  initialTotalAmount?: number | null;
  sourceCode: string;
  otaEntryMode: OtaEntryMode;
  commissionableInput: number;
  totalAmount: number;
}): string | null {
  const {
    rawNotes,
    isEdit,
    initialTotalAmount,
    sourceCode,
    otaEntryMode,
    commissionableInput,
    totalAmount,
  } = params;

  const trimmedNotes = rawNotes.trim();
  if (!isOtaCommissionableSource(sourceCode) || otaEntryMode !== 'commissionable') {
    return trimmedNotes || null;
  }

  if (
    isEdit &&
    initialTotalAmount !== undefined &&
    initialTotalAmount !== null &&
    Math.round(Number(initialTotalAmount)) === Math.round(totalAmount)
  ) {
    return trimmedNotes || null;
  }

  const channelLabel = sourceCode.toLowerCase() === 'booking' ? 'Booking.com' : 'Agoda';
  const otaAuditNote = `[سند ${channelLabel}: المبلغ الاسمي ${formatIDRWithCommas(commissionableInput)} | الصافي للبنك ${formatIDRWithCommas(totalAmount)}]`;

  if (!trimmedNotes) return otaAuditNote;
  if (trimmedNotes.endsWith(otaAuditNote)) return trimmedNotes;
  return `${trimmedNotes}\n${otaAuditNote}`;
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
