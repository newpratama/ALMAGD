import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { broadcastDataChange } from '../lib/broadcast';
import type { Database } from '../lib/database.types';

export type Guest = Database['public']['Tables']['guests']['Row'];
export type GuestInsert = Database['public']['Tables']['guests']['Insert'];
export type GuestUpdate = Database['public']['Tables']['guests']['Update'];
export type BookingOverview = Database['public']['Views']['booking_overview']['Row'];

export interface GuestListItem extends Guest {
  bookings?: { id: string; check_in: string; status: string }[];
}

function sanitizeSearchQuery(q: string): string {
  // Escape commas, parentheses, and percent signs for PostgREST .or() filter
  return q.replace(/[%(),]/g, ' ').trim();
}

export async function searchGuests(q: string): Promise<GuestListItem[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const cleaned = sanitizeSearchQuery(q);

  if (cleaned.length < 2) {
    const { data, error } = await supabase
      .from('guests')
      .select('*, bookings(id, check_in, status)')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data as unknown as GuestListItem[]) || [];
  }

  const pattern = `%${cleaned}%`;
  const { data, error } = await supabase
    .from('guests')
    .select('*, bookings(id, check_in, status)')
    .or(`full_name.ilike.${pattern},phone.ilike.${pattern},id_number.ilike.${pattern}`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data as unknown as GuestListItem[]) || [];
}

export async function fetchGuest(id: string): Promise<Guest> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchGuestHistory(guestId: string): Promise<BookingOverview[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('booking_overview')
    .select('*')
    .eq('guest_id', guestId)
    .order('check_in', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createGuest(input: GuestInsert): Promise<Guest> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('guests')
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGuest(id: string, updates: GuestUpdate): Promise<Guest> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('guests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGuest(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('guests').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadGuestIdPhoto(guestId: string, file: File): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `guest-ids/${guestId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('guest-ids')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Update guest row with the new photo path
  await updateGuest(guestId, { id_photo_path: filePath });

  return filePath;
}

export async function getGuestIdPhotoUrl(path: string): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.storage
    .from('guest-ids')
    .createSignedUrl(path, 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteGuestIdPhoto(guestId: string, path: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error: storageError } = await supabase.storage
    .from('guest-ids')
    .remove([path]);

  if (storageError) throw storageError;

  await updateGuest(guestId, { id_photo_path: null });
}

export function useGuests(search = '') {
  return useQuery({
    queryKey: ['guests', search],
    queryFn: () => searchGuests(search),
  });
}

export function useGuest(id: string | undefined) {
  return useQuery({
    queryKey: ['guest', id],
    queryFn: () => (id ? fetchGuest(id) : Promise.reject('No guest ID')),
    enabled: Boolean(id),
  });
}

export function useGuestHistory(guestId: string | undefined) {
  return useQuery({
    queryKey: ['guest-history', guestId],
    queryFn: () => (guestId ? fetchGuestHistory(guestId) : Promise.resolve([])),
    enabled: Boolean(guestId),
  });
}

export function useCreateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      broadcastDataChange('guests');
    },
  });
}

export function useUpdateGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: GuestUpdate }) =>
      updateGuest(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guest', variables.id] });
      broadcastDataChange('guests');
    },
  });
}

export function useDeleteGuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      broadcastDataChange('guests');
    },
  });
}
