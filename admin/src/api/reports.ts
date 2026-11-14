import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface DailyReportRow {
  day: string;
  rooms_total: number;
  rooms_occupied: number;
  rooms_blocked: number;
  revenue: number;
  paid_cash: number;
  paid_transfer: number;
  paid_app: number;
  paid_other: number;
}

export interface SourceReportRow {
  source_code: string;
  label: string;
  color: string;
  bookings: number;
  nights: number;
  revenue: number;
}

export interface ChannelCollectionSummary {
  bySource: Record<string, number>;
  total: number;
}

export async function fetchReportDaily(from: string, to: string): Promise<DailyReportRow[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.rpc('report_daily', {
    p_from: from,
    p_to: to,
  });

  if (error) throw error;
  return (data || []) as DailyReportRow[];
}

export async function fetchReportBySource(from: string, to: string): Promise<SourceReportRow[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.rpc('report_by_source', {
    p_from: from,
    p_to: to,
  });

  if (error) throw error;
  return (data || []) as SourceReportRow[];
}

export async function fetchReportChannelCollections(from: string, to: string): Promise<ChannelCollectionSummary> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('payments')
    .select('amount, method, paid_on, bookings(source_code)')
    .gte('paid_on', from)
    .lte('paid_on', to);

  if (error) throw error;

  const bySource: Record<string, number> = {};
  let total = 0;

  for (const p of data || []) {
    const src = (p.bookings as any)?.source_code || 'walk_in';
    const amt = Number(p.amount || 0);
    bySource[src] = (bySource[src] || 0) + amt;
    total += amt;
  }

  return { bySource, total };
}

export function useReportDaily(from: string, to: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['report-daily', from, to],
    queryFn: () => fetchReportDaily(from, to),
    enabled: options?.enabled !== false && Boolean(from && to && to >= from),
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}

export function useReportBySource(from: string, to: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['report-source', from, to],
    queryFn: () => fetchReportBySource(from, to),
    enabled: options?.enabled !== false && Boolean(from && to && to >= from),
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}

export function useReportChannelCollections(from: string, to: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['report-channel-collections', from, to],
    queryFn: () => fetchReportChannelCollections(from, to),
    enabled: options?.enabled !== false && Boolean(from && to && to >= from),
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
}
