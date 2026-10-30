import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export type StaffMember = Database['public']['Tables']['staff']['Row'];
export type StaffInsert = Database['public']['Tables']['staff']['Insert'];
export type StaffUpdate = Database['public']['Tables']['staff']['Update'];

export async function fetchStaffList(): Promise<StaffMember[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createStaff(input: StaffInsert): Promise<StaffMember> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('staff')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateStaff(id: string, updates: StaffUpdate): Promise<StaffMember> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useStaffList() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: fetchStaffList,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}

export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: StaffUpdate }) =>
      updateStaff(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}
