import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { broadcastDataChange } from '../lib/broadcast';
import type { Database } from '../lib/database.types';

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export async function fetchPayments(bookingId: string): Promise<Payment[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('booking_id', bookingId)
    .order('paid_on', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createPayment(input: PaymentInsert): Promise<Payment> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('payments')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePayment(id: string, updates: PaymentUpdate): Promise<Payment> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePayment(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}

export function usePayments(bookingId: string | undefined) {
  return useQuery({
    queryKey: ['payments', bookingId],
    queryFn: () => (bookingId ? fetchPayments(bookingId) : Promise.resolve([])),
    enabled: Boolean(bookingId),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPayment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments', variables.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['booking', variables.booking_id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      broadcastDataChange('payments');
    },
  });
}

export function useUpdatePayment(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: PaymentUpdate }) =>
      updatePayment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      broadcastDataChange('payments');
    },
  });
}

export function useDeletePayment(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      broadcastDataChange('payments');
    },
  });
}
