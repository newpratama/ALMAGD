import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { nightsBetween } from '../lib/dates';

export interface CalendarBookingDetails {
  id: string;
  code: string;
  status: string;
  source_code: string;
  unit_id: number;
  check_in: string;
  check_out: string;
  nights?: number;
  adults: number;
  children: number;
  total_amount: number;
  notes: string | null;
  ota_reference: string | null;
  due_date: string | null;
  guests: {
    full_name: string;
    phone: string | null;
    tags: string[] | null;
  } | null;
  payments?: {
    id: string;
    amount: number;
    method: string;
    paid_on: string;
  }[];
  paid?: number;
  balance?: number;
  payment_status?: 'paid' | 'partial' | 'unpaid';
}

export interface CalendarOccupancyItem {
  id: number;
  room_id: number;
  stay: string; // e.g. '[2026-10-01,2026-10-04)'
  booking_id: string | null;
  block_id: string | null;
  bookings: CalendarBookingDetails | null;
  unit_blocks: {
    id: string;
    unit_id: number;
    reason: string;
  } | null;
}

export async function fetchCalendar(from: string, to: string): Promise<CalendarOccupancyItem[]> {
  if (!supabase) throw new Error('Supabase not configured');

  // Query room_occupancy overlapping the requested range [from, to)
  const { data, error } = await supabase
    .from('room_occupancy')
    .select(
      `
      id,
      room_id,
      stay,
      booking_id,
      block_id,
      bookings (
        id,
        code,
        status,
        source_code,
        unit_id,
        check_in,
        check_out,
        adults,
        children,
        total_amount,
        notes,
        ota_reference,
        due_date,
        guests (
          full_name,
          phone,
          tags
        ),
        payments (
          id,
          amount,
          method,
          paid_on
        )
      ),
      unit_blocks (
        id,
        unit_id,
        reason
      )
    `
    )
    .overlaps('stay', `[${from},${to})`);

  if (error) throw error;

  const items = (data || []) as unknown as CalendarOccupancyItem[];
  for (const item of items) {
    if (item.bookings) {
      const total = Number(item.bookings.total_amount || 0);
      const paymentsList = item.bookings.payments || [];
      const paid = paymentsList.reduce((acc, p) => acc + Number(p.amount || 0), 0);
      const balance = total - paid;
      item.bookings.paid = paid;
      item.bookings.balance = balance;
      item.bookings.payment_status =
        balance <= 0 && paid > 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
      if (item.bookings.check_in && item.bookings.check_out) {
        item.bookings.nights = nightsBetween(item.bookings.check_in, item.bookings.check_out);
      }
    }
  }

  return items;
}

export function useCalendar(from: string, to: string) {
  return useQuery({
    queryKey: ['calendar', from, to],
    queryFn: () => fetchCalendar(from, to),
    enabled: Boolean(from && to && to > from),
  });
}
