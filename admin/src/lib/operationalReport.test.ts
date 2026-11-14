import { describe, expect, it } from 'vitest';
import {
  chunkIds,
  buildPaymentSequenceAndTotals,
  resolveOutsideBookingBalance,
  parseTransferNote,
} from './operationalReport';

describe('operationalReport helpers', () => {
  it('chunkIds splits arrays into batches of given size', () => {
    expect(chunkIds([], 50)).toEqual([]);
    expect(chunkIds(['a', 'b', 'c'], 2)).toEqual([['a', 'b'], ['c']]);
    expect(chunkIds(['a', 'b'], 50)).toEqual([['a', 'b']]);
  });

  it('buildPaymentSequenceAndTotals orders chronologically by paid_on then created_at and sums total paid', () => {
    const payments = [
      // Payment on 2026-11-13 entered earlier (created_at 2026-11-09)
      {
        id: 'p3',
        booking_id: 'b-180',
        paid_on: '2026-11-13',
        created_at: '2026-11-09T03:26:56Z',
        amount: 2000000,
      },
      // Payment on 2026-11-04 entered first
      {
        id: 'p1',
        booking_id: 'b-180',
        paid_on: '2026-11-04',
        created_at: '2026-11-04T14:49:34Z',
        amount: 2000000,
      },
      // Backdated payment on 2026-11-04 entered later
      {
        id: 'p2',
        booking_id: 'b-180',
        paid_on: '2026-11-04',
        created_at: '2026-11-13T07:20:17Z',
        amount: 2000000,
      },
      // Payment on 2026-11-06
      {
        id: 'p2b',
        booking_id: 'b-180',
        paid_on: '2026-11-06',
        created_at: '2026-11-07T01:24:02Z',
        amount: 2000000,
      },
    ];

    const { seqMap, totalPaidByBooking } = buildPaymentSequenceAndTotals(payments);

    expect(seqMap.get('p1')).toBe(1);
    expect(seqMap.get('p2')).toBe(2);
    expect(seqMap.get('p2b')).toBe(3);
    expect(seqMap.get('p3')).toBe(4);
    expect(totalPaidByBooking.get('b-180')).toBe(8000000);
  });

  it('resolveOutsideBookingBalance returns 0 when 6M prior + 2M today covers full 8M booking', () => {
    // Using overviewBalance = 0
    expect(
      resolveOutsideBookingBalance({
        totalAmount: 8000000,
        overviewBalance: 0,
        totalPaid: 8000000,
        fallbackCollectedInPeriod: 2000000,
      })
    ).toBe(0);

    // Without overviewBalance (falls back to totalPaid across all payments, NOT todayCollected)
    expect(
      resolveOutsideBookingBalance({
        totalAmount: 8000000,
        overviewBalance: undefined,
        totalPaid: 8000000,
        fallbackCollectedInPeriod: 2000000,
      })
    ).toBe(0);
  });

  it('resolveOutsideBookingBalance shows accurate remaining balance only when unpaid balance truly exists', () => {
    // Total 8M, 3M paid previously + 2M paid today = 5M paid -> 3M remaining
    expect(
      resolveOutsideBookingBalance({
        totalAmount: 8000000,
        overviewBalance: 3000000,
        totalPaid: 5000000,
        fallbackCollectedInPeriod: 2000000,
      })
    ).toBe(3000000);

    // Fallback path: total 8M, 5M paid total -> 3M remaining
    expect(
      resolveOutsideBookingBalance({
        totalAmount: 8000000,
        totalPaid: 5000000,
        fallbackCollectedInPeriod: 2000000,
      })
    ).toBe(3000000);

    // Overpaid booking clamps to 0 (no negative balance)
    expect(
      resolveOutsideBookingBalance({
        totalAmount: 8000000,
        overviewBalance: -500000,
        totalPaid: 8500000,
        fallbackCollectedInPeriod: 2000000,
      })
    ).toBe(0);

    // Booking with refund reducing net paid: 8M total, 8M paid - 2M refund = 6M net -> 2M remaining
    const { totalPaidByBooking } = buildPaymentSequenceAndTotals([
      { id: '1', booking_id: 'b-ref', paid_on: '2026-11-04', created_at: '2026-11-04T10:00:00Z', amount: 8000000 },
      { id: '2', booking_id: 'b-ref', paid_on: '2026-11-13', created_at: '2026-11-13T10:00:00Z', amount: -2000000 },
    ]);
    expect(
      resolveOutsideBookingBalance({
        totalAmount: 8000000,
        totalPaid: totalPaidByBooking.get('b-ref'),
        fallbackCollectedInPeriod: -2000000,
      })
    ).toBe(2000000);
  });

  it('parseTransferNote extracts Arabic and Indonesian transfer details', () => {
    expect(
      parseTransferNote('[متابعة نقل النزيل من Villa 1 (الحجز السابق: B00100) ابتداءً من 2026-11-10]')
    ).toEqual({ transferFromUnit: 'Villa 1', transferBookingCode: 'B00100' });

    expect(
      parseTransferNote('[متابعة نقل النزيل من Villa 14 - Kamar 1 ابتداءً من 2026-11-10]')
    ).toEqual({ transferFromUnit: 'Villa 14 - Kamar 1', transferBookingCode: null });

    expect(
      parseTransferNote('[Lanjutan pindah unit dari Villa 2 (Booking sebelumnya: B00101) mulai 2026-11-10]')
    ).toEqual({ transferFromUnit: 'Villa 2', transferBookingCode: 'B00101' });

    expect(parseTransferNote(null)).toEqual({ transferFromUnit: null, transferBookingCode: null });
  });
});
