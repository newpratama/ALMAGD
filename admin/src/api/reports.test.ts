import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { supabase } from '../lib/supabase';
import { fetchReportDaily, fetchReportBySource, fetchReportChannelCollections } from './reports';
import {
  buildPaymentSequenceAndTotals,
  resolveOutsideBookingBalance,
} from '../lib/operationalReport';

describe('Reports API integration & Channel Collections', () => {
  beforeAll(async () => {
    if (supabase) {
      await supabase.auth.signInWithPassword({
        email: 'newpratama25@gmail.com',
        password: '1NP.A@M.com',
      });
    }
  });

  afterAll(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  });

  it('fetchReportChannelCollections accurately aggregates October 2026 collections', async () => {
    const from = '2026-10-01';
    const to = '2026-10-31';

    const result = await fetchReportChannelCollections(from, to);
    expect(result).toBeDefined();
    expect(result.total).toBe(311929664);

    // Verify individual channels
    expect(result.bySource['walk_in']).toBe(266730189);
    expect(result.bySource['tiket']).toBe(27945420);
    expect(result.bySource['booking']).toBe(10677653);
    expect(result.bySource['agoda']).toBe(6576402);

    // Sum of channels matches total
    const sumChannels =
      result.bySource['walk_in'] +
      result.bySource['tiket'] +
      result.bySource['booking'] +
      result.bySource['agoda'];
    expect(sumChannels).toBe(result.total);
  });

  it('fetchReportDaily and fetchReportBySource work consistently with collections', async () => {
    const from = '2026-10-01';
    const to = '2026-10-31';

    const [daily, bySource, collections] = await Promise.all([
      fetchReportDaily(from, to),
      fetchReportBySource(from, to),
      fetchReportChannelCollections(from, to),
    ]);

    expect(daily.length).toBe(31);
    expect(bySource.length).toBeGreaterThan(0);

    // Verify daily total received matches channel collections total
    const dailyTotalReceived = daily.reduce(
      (sum, d) =>
        sum +
        Number(d.paid_cash || 0) +
        Number(d.paid_transfer || 0) +
        Number(d.paid_app || 0) +
        Number(d.paid_other || 0),
      0
    );

    expect(dailyTotalReceived).toBe(collections.total);
  }, 15000);

  it('outside-stay booking B00180 on 2026-11-13 resolves full paid balance accurately', async () => {
    expect(supabase).not.toBeNull();
    const client = supabase!;

    const { data: overview, error: ovErr } = await client
      .from('booking_overview')
      .select('id, code, total_amount, paid, balance')
      .eq('code', 'B00180')
      .single();
    expect(ovErr).toBeNull();
    expect(overview).toBeTruthy();

    const { data: allPayments, error: pErr } = await client
      .from('payments')
      .select('id, booking_id, paid_on, created_at, amount')
      .eq('booking_id', overview!.id!)
      .order('paid_on', { ascending: true })
      .order('created_at', { ascending: true });
    expect(pErr).toBeNull();

    const records = (allPayments || []).map((p) => ({
      id: p.id,
      booking_id: p.booking_id,
      paid_on: p.paid_on,
      created_at: p.created_at,
      amount: Number(p.amount || 0),
    }));

    const { totalPaidByBooking } = buildPaymentSequenceAndTotals(records);
    const collectedOnDay = records
      .filter((p) => p.paid_on === '2026-11-13')
      .reduce((s, p) => s + p.amount, 0);

    const resolvedFromOverview = resolveOutsideBookingBalance({
      totalAmount: Number(overview!.total_amount || 0),
      overviewBalance: overview!.balance,
      totalPaid: totalPaidByBooking.get(overview!.id!),
      fallbackCollectedInPeriod: collectedOnDay,
    });

    const resolvedFromPayments = resolveOutsideBookingBalance({
      totalAmount: Number(overview!.total_amount || 0),
      totalPaid: totalPaidByBooking.get(overview!.id!),
      fallbackCollectedInPeriod: collectedOnDay,
    });

    expect(totalPaidByBooking.get(overview!.id!)).toBe(Number(overview!.paid || 0));
    expect(resolvedFromOverview).toBe(Math.max(0, Number(overview!.balance || 0)));
    expect(resolvedFromPayments).toBe(Math.max(0, Number(overview!.balance || 0)));
    expect(resolvedFromOverview).toBe(0);
  }, 15000);
});
