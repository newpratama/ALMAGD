import { describe, expect, it } from 'vitest';
import {
  buildBookingFinalNotes,
  getInitialBookingPricingState,
  isOtaCommissionableSource,
} from './bookingHelpers';
import { calcOtaNetPayout, formatIDRWithCommas } from './money';

describe('bookingHelpers OTA edit protection', () => {
  it('identifies booking and agoda as commissionable OTA sources', () => {
    expect(isOtaCommissionableSource('booking')).toBe(true);
    expect(isOtaCommissionableSource('agoda')).toBe(true);
    expect(isOtaCommissionableSource('walk_in')).toBe(false);
    expect(isOtaCommissionableSource('traveloka')).toBe(false);
    expect(isOtaCommissionableSource(null)).toBe(false);
  });

  it('defaults edit mode for Booking.com and Agoda to net without re-deducting 17.871%', () => {
    const voucher = 1452500;
    const net = calcOtaNetPayout(voucher).netPayout;

    for (const source of ['agoda', 'booking'] as const) {
      const state = getInitialBookingPricingState({
        source_code: source,
        total_amount: net,
        check_in: '2026-12-31',
        check_out: '2027-01-02',
        notes: `[سند ${source === 'booking' ? 'Booking.com' : 'Agoda'}: المبلغ الاسمي Rp 1,452,500 | الصافي للبنك ${formatIDRWithCommas(net)}]`,
      });

      expect(state.otaEntryMode).toBe('net');
      expect(state.totalAmount).toBe(net);
      expect(state.commissionableInput).toBe(voucher);
      expect(state.pricePerNight).toBe(Math.round(net / 2));
      // Switching to commissionable with initial commissionableInput preserves exact net
      expect(calcOtaNetPayout(state.commissionableInput).netPayout).toBe(net);
    }
  });

  it('inverts saved net total in edit mode when no matching audit note exists', () => {
    const state = getInitialBookingPricingState({
      source_code: 'agoda',
      total_amount: 1166771,
      check_in: '2026-12-31',
      check_out: '2027-01-01',
      notes: null,
    });

    expect(state.otaEntryMode).toBe('net');
    expect(state.totalAmount).toBe(1166771);
    expect(calcOtaNetPayout(state.commissionableInput).netPayout).toBe(1166771);
  });

  it('does not append duplicate audit notes when editing in net mode or unchanged total', () => {
    const existingNote = '[سند Agoda: المبلغ الاسمي Rp 1,452,500 | الصافي للبنك Rp 1,301,371]';

    expect(
      buildBookingFinalNotes({
        rawNotes: existingNote,
        isEdit: true,
        initialTotalAmount: 1301371,
        sourceCode: 'agoda',
        otaEntryMode: 'net',
        commissionableInput: 1452500,
        totalAmount: 1301371,
      })
    ).toBe(existingNote);

    expect(
      buildBookingFinalNotes({
        rawNotes: existingNote,
        isEdit: true,
        initialTotalAmount: 1301371,
        sourceCode: 'agoda',
        otaEntryMode: 'commissionable',
        commissionableInput: 1452500,
        totalAmount: 1301371,
      })
    ).toBe(existingNote);

    // When user intentionally enters a new voucher and changes totalAmount, audit note is appended
    const newNet = calcOtaNetPayout(2000000).netPayout;
    const updatedNotes = buildBookingFinalNotes({
      rawNotes: existingNote,
      isEdit: true,
      initialTotalAmount: 1301371,
      sourceCode: 'agoda',
      otaEntryMode: 'commissionable',
      commissionableInput: 2000000,
      totalAmount: newNet,
    });
    expect(updatedNotes).toContain(existingNote);
    expect(updatedNotes).toContain(`المبلغ الاسمي Rp 2,000,000 | الصافي للبنك ${formatIDRWithCommas(newNet)}`);
  });
});
