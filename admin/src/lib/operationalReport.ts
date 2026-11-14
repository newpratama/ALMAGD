export interface OperationalPaymentRecord {
  id: string;
  booking_id: string;
  paid_on: string;
  created_at: string;
  amount: number;
}

export interface PaymentSequencesAndTotals {
  seqMap: Map<string, number>;
  totalPaidByBooking: Map<string, number>;
}

/**
 * Splits a list of IDs into fixed-size batches for safe IN-filter queries.
 */
export function chunkIds<T>(ids: readonly T[], batchSize = 50): T[][] {
  if (batchSize <= 0) return [Array.from(ids)];
  const batches: T[][] = [];
  for (let i = 0; i < ids.length; i += batchSize) {
    batches.push(ids.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Computes chronological payment sequence numbers (1, 2, ...) and net total
 * paid across all payments for each booking.
 */
export function buildPaymentSequenceAndTotals(
  allPayments: readonly OperationalPaymentRecord[]
): PaymentSequencesAndTotals {
  const sorted = [...allPayments].sort((a, b) => {
    const paidCmp = (a.paid_on || '').localeCompare(b.paid_on || '');
    if (paidCmp !== 0) return paidCmp;
    const createdCmp = (a.created_at || '').localeCompare(b.created_at || '');
    if (createdCmp !== 0) return createdCmp;
    return a.id.localeCompare(b.id);
  });

  const seqMap = new Map<string, number>();
  const countMap = new Map<string, number>();
  const totalPaidByBooking = new Map<string, number>();

  for (const p of sorted) {
    const seq = (countMap.get(p.booking_id) || 0) + 1;
    countMap.set(p.booking_id, seq);
    seqMap.set(p.id, seq);
    totalPaidByBooking.set(
      p.booking_id,
      (totalPaidByBooking.get(p.booking_id) || 0) + Number(p.amount || 0)
    );
  }

  return { seqMap, totalPaidByBooking };
}

/**
 * Resolves the remaining balance for an outside-stay booking row.
 * Prefers the authoritative balance from booking_overview; otherwise subtracts
 * total paid across all dates (not only the selected report period) from totalAmount.
 */
export function resolveOutsideBookingBalance(params: {
  totalAmount: number;
  overviewBalance?: number | null;
  totalPaid?: number;
  fallbackCollectedInPeriod: number;
}): number {
  const { totalAmount, overviewBalance, totalPaid, fallbackCollectedInPeriod } = params;
  if (overviewBalance !== undefined && overviewBalance !== null) {
    return Math.max(0, Number(overviewBalance));
  }
  const effectivePaid = totalPaid !== undefined ? totalPaid : fallbackCollectedInPeriod;
  return Math.max(0, Number(totalAmount || 0) - effectivePaid);
}

const TRANSFER_PATTERNS = [
  { prefix: 'متابعة نقل النزيل من', prevLabel: 'الحجز السابق', datePrefix: 'ابتداءً' },
  { prefix: 'Lanjutan pindah unit dari', prevLabel: 'Booking sebelumnya', datePrefix: 'mulai' },
] as const;

/**
 * Parses a mid-stay unit transfer annotation from booking notes.
 */
export function parseTransferNote(notes: string | null | undefined): {
  transferFromUnit: string | null;
  transferBookingCode: string | null;
} {
  if (!notes) {
    return { transferFromUnit: null, transferBookingCode: null };
  }
  for (const { prefix, prevLabel, datePrefix } of TRANSFER_PATTERNS) {
    const withCode = notes.match(new RegExp(`${prefix}\\s+(.+?)\\s*\\(${prevLabel}:\\s*([^)]+)\\)`));
    if (withCode) {
      return {
        transferFromUnit: withCode[1].trim(),
        transferBookingCode: withCode[2].trim() || null,
      };
    }
    const withoutCode = notes.match(new RegExp(`${prefix}\\s+([^(\\]]+?)(?:\\s+${datePrefix}|\\]|$)`));
    if (withoutCode) {
      return {
        transferFromUnit: withoutCode[1].trim(),
        transferBookingCode: null,
      };
    }
  }
  return { transferFromUnit: null, transferBookingCode: null };
}
