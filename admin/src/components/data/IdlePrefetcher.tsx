import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchUnits } from '../../api/units';
import { fetchBookingSources } from '../../api/bookings';
import { todayISO } from '../../lib/dates';
import { supabase } from '../../lib/supabase';
import type { BookingOverview } from '../../api/bookings';

/**
 * IdlePrefetcher warm-up component modeled after OUD's RoleBasedPrefetcher.
 * Uses requestIdleCallback with pacing (300ms) to silently prefetch
 * critical hotel operations data (units, booking sources, today's arrivals/departures)
 * during browser idle time so reception navigation is 0ms instantaneous.
 */
export const IdlePrefetcher: React.FC = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;

    const todayStr = todayISO();

    const prefetchTasks: Array<() => Promise<unknown>> = [
      // 1. All 96 units
      () =>
        queryClient.prefetchQuery({
          queryKey: ['units'],
          queryFn: fetchUnits,
          staleTime: 1000 * 60 * 5, // 5 min
        }),

      // 2. Booking sources
      () =>
        queryClient.prefetchQuery({
          queryKey: ['booking-sources'],
          queryFn: fetchBookingSources,
          staleTime: 1000 * 60 * 10,
        }),

      // 3. Today's in-house bookings
      () =>
        queryClient.prefetchQuery({
          queryKey: ['today-in-house', todayStr],
          queryFn: async () => {
            if (!supabase) return [];
            const { data, error } = await supabase
              .from('booking_overview')
              .select('*')
              .lte('check_in', todayStr)
              .gt('check_out', todayStr)
              .in('status', ['confirmed', 'checked_in'])
              .order('unit_name', { ascending: true });
            if (error) throw error;
            return (data || []) as BookingOverview[];
          },
          staleTime: 1000 * 30,
        }),

      // 4. Today's arrivals
      () =>
        queryClient.prefetchQuery({
          queryKey: ['today-arrivals', todayStr],
          queryFn: async () => {
            if (!supabase) return [];
            const { data, error } = await supabase
              .from('booking_overview')
              .select('*')
              .eq('check_in', todayStr)
              .neq('status', 'cancelled')
              .order('unit_name', { ascending: true });
            if (error) throw error;
            return (data || []) as BookingOverview[];
          },
          staleTime: 1000 * 30,
        }),

      // 5. Today's departures
      () =>
        queryClient.prefetchQuery({
          queryKey: ['today-departures', todayStr],
          queryFn: async () => {
            if (!supabase) return [];
            const { data, error } = await supabase
              .from('booking_overview')
              .select('*')
              .eq('check_out', todayStr)
              .neq('status', 'cancelled')
              .order('unit_name', { ascending: true });
            if (error) throw error;
            return (data || []) as BookingOverview[];
          },
          staleTime: 1000 * 30,
        }),

      // 6. Prefetch all Admin page JS chunks during browser idle time (0ms instant page navigation)
      () => import('../../pages/CalendarPage'),
      () => import('../../pages/BookingsPage'),
      () => import('../../pages/GuestsPage'),
      () => import('../../pages/ReportsPage'),
      () => import('../../pages/SettingsPage'),
    ];

    let taskIndex = 0;

    const executeNext = async () => {
      if (cancelled || taskIndex >= prefetchTasks.length) return;
      const currentTask = prefetchTasks[taskIndex++];
      try {
        await currentTask();
      } catch {
        // Prefetch failure shouldn't disrupt user experience
      }

      if (!cancelled) {
        timer = setTimeout(schedule, 300);
      }
    };

    const schedule = () => {
      if (cancelled || taskIndex >= prefetchTasks.length) return;
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleId = (window as unknown as {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
        }).requestIdleCallback(() => {
          void executeNext();
        }, { timeout: 3000 });
      } else {
        timer = setTimeout(() => {
          void executeNext();
        }, 800);
      }
    };

    // Initial trigger after mount
    timer = setTimeout(schedule, 1000);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (idleId !== undefined && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, [queryClient]);

  return null;
};
