import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { broadcastDataChange } from '../lib/broadcast';
import type { Database } from '../lib/database.types';

export type Unit = Database['public']['Tables']['units']['Row'];
export type UnitUpdate = Database['public']['Tables']['units']['Update'];

export async function fetchUnits(): Promise<Unit[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function fetchAvailableUnits(
  from: string,
  to: string,
  excludeBookingId?: string | null
): Promise<Unit[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.rpc('available_units', {
    p_from: from,
    p_to: to,
    p_exclude_booking: excludeBookingId || undefined,
  });

  if (error) throw error;
  return data || [];
}

export async function updateUnit(id: number, updates: UnitUpdate): Promise<Unit> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: fetchUnits,
  });
}

export function useAvailableUnits(
  from: string,
  to: string,
  excludeBookingId?: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['units', 'available', from, to, excludeBookingId],
    queryFn: () => fetchAvailableUnits(from, to, excludeBookingId),
    enabled: options?.enabled !== false && Boolean(from && to && to > from),
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UnitUpdate }) =>
      updateUnit(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      broadcastDataChange('units');
    },
  });
}
