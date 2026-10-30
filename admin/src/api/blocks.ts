import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { broadcastDataChange } from '../lib/broadcast';
import type { Database } from '../lib/database.types';

export type UnitBlock = Database['public']['Tables']['unit_blocks']['Row'] & {
  units?: {
    name: string;
  } | null;
};
export type UnitBlockInsert = Database['public']['Tables']['unit_blocks']['Insert'];

export async function fetchUnitBlocks(): Promise<UnitBlock[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('unit_blocks')
    .select('*, units(name)')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createUnitBlock(input: UnitBlockInsert): Promise<UnitBlock> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('unit_blocks')
    .insert(input)
    .select('*, units(name)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUnitBlock(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('unit_blocks').delete().eq('id', id);
  if (error) throw error;
}

export function useUnitBlocks() {
  return useQuery({
    queryKey: ['blocks'],
    queryFn: fetchUnitBlocks,
  });
}

export function useCreateUnitBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUnitBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      broadcastDataChange('blocks');
    },
  });
}

export function useDeleteUnitBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUnitBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['today'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      broadcastDataChange('blocks');
    },
  });
}
