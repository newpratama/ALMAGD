import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { broadcastDataChange } from '../lib/broadcast';
import type { Database } from '../lib/database.types';

export type BookingOverview = Database['public']['Views']['booking_overview']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];
export type BookingSource = Database['public']['Tables']['booking_sources']['Row'];
export type AuditLogEntry = Database['public']['Tables']['audit_log']['Row'];

export interface BookingFilters {
  from?: string;
  to?: string;
  status?: string;
  source?: string;
  payment_status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListBookingsResult {
  bookings: BookingOverview[];
  total: number;
}

export async function fetchBookingSources(): Promise<BookingSource[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('booking_sources')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updateBookingSource(
  code: string,
  updates: Partial<BookingSource>
): Promise<BookingSource> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('booking_sources')
    .update(updates)
    .eq('code', code)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listBookings(filters: BookingFilters = {}): Promise<ListBookingsResult> {
  if (!supabase) throw new Error('Supabase not configured');

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  let query = supabase
    .from('booking_overview')
    .select('*', { count: 'exact' });

  // Date range overlap: check_in < to AND check_out > from
  if (filters.to) {
    query = query.lt('check_in', filters.to);
  }
  if (filters.from) {
    query = query.gt('check_out', filters.from);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.source && filters.source !== 'all') {
    query = query.eq('source_code', filters.source);
  }

  if (filters.payment_status && filters.payment_status !== 'all') {
    query = query.eq('payment_status', filters.payment_status);
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.replace(/[%(),]/g, ' ').trim();
    if (q) {
      query = query.or(`code.ilike.%${q}%,guest_name.ilike.%${q}%,ota_reference.ilike.%${q}%`);
    }
  }

  query = query.order('check_in', { ascending: false }).range(fromIndex, toIndex);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    bookings: data || [],
    total: count || 0,
  };
}

export async function fetchAllBookingsForExport(filters: BookingFilters = {}): Promise<BookingOverview[]> {
  if (!supabase) throw new Error('Supabase not configured');

  let query = supabase.from('booking_overview').select('*');

  if (filters.to) {
    query = query.lt('check_in', filters.to);
  }
  if (filters.from) {
    query = query.gt('check_out', filters.from);
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.source && filters.source !== 'all') {
    query = query.eq('source_code', filters.source);
  }
  if (filters.payment_status && filters.payment_status !== 'all') {
    query = query.eq('payment_status', filters.payment_status);
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.replace(/[%(),]/g, ' ').trim();
    if (q) {
      query = query.or(`code.ilike.%${q}%,guest_name.ilike.%${q}%,ota_reference.ilike.%${q}%`);
    }
  }

  query = query.order('check_in', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchBooking(id: string): Promise<BookingOverview> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('booking_overview')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createBooking(
  input: BookingInsert,
  firstPayment?: {
    amount: number;
    method: 'cash' | 'transfer' | 'app' | 'other';
    reference?: string;
    notes?: string;
  }
): Promise<{ booking: Booking; paymentError?: Error }> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert(input)
    .select()
    .single();

  if (bookingErr) throw bookingErr;

  let paymentError: Error | undefined;

  if (firstPayment && firstPayment.amount > 0) {
    const { error: pErr } = await supabase.from('payments').insert({
      booking_id: booking.id,
      amount: firstPayment.amount,
      method: firstPayment.method,
      reference: firstPayment.reference || null,
      notes: firstPayment.notes || null,
    });

    if (pErr) {
      console.error('Failed to create first payment:', pErr);
      paymentError = pErr;
    }
  }

  return { booking, paymentError };
}

export async function updateBooking(id: string, updates: BookingUpdate): Promise<Booking> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBooking(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) throw error;
}

export async function clearNeedsReview(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('bookings')
    .update({ needs_review: false })
    .eq('id', id);

  if (error) throw error;
}

export async function fetchBookingAuditLog(bookingId: string): Promise<AuditLogEntry[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .or(`row_id.eq.${bookingId},new_data->>booking_id.eq.${bookingId},old_data->>booking_id.eq.${bookingId}`)
    .order('at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useBookingSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: fetchBookingSources,
  });
}

export function useBookings(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: () => listBookings(filters),
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => (id ? fetchBooking(id) : Promise.reject('No booking ID')),
    enabled: Boolean(id),
  });
}

export function useBookingAuditLog(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['booking-audit', bookingId],
    queryFn: () => (bookingId ? fetchBookingAuditLog(bookingId) : Promise.resolve([])),
    enabled: Boolean(bookingId),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      input,
      firstPayment,
    }: {
      input: BookingInsert;
      firstPayment?: {
        amount: number;
        method: 'cash' | 'transfer' | 'app' | 'other';
        reference?: string;
        notes?: string;
      };
    }) => createBooking(input, firstPayment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      broadcastDataChange('bookings');
    },
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: BookingUpdate }) =>
      updateBooking(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      broadcastDataChange('bookings');
    },
  });
}

export function useUpdateBookingSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, updates }: { code: string; updates: Partial<BookingSource> }) =>
      updateBookingSource(code, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-sources'] });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      broadcastDataChange('bookings');
    },
  });
}
