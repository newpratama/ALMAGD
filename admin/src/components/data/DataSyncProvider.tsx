import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { subscribeToCrossTabSync, broadcastDataChange, SyncDomain } from '../../lib/broadcast';
import { encryptedCache } from '../../lib/encryptedStorage';
import { useAuth } from '../../auth/AuthProvider';

export const DataSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { staff } = useAuth();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize encrypted session cache when staff user is active
  useEffect(() => {
    if (staff?.id) {
      void encryptedCache.init(staff.id);
    } else {
      void encryptedCache.clear();
    }
  }, [staff?.id]);

  // 1. Cross-tab synchronization via BroadcastChannel (Same browser, multiple tabs)
  useEffect(() => {
    const unsubscribe = subscribeToCrossTabSync((domain: SyncDomain) => {
      if (domain === 'all') {
        void queryClient.invalidateQueries();
      } else if (domain === 'bookings') {
        void queryClient.invalidateQueries({ queryKey: ['bookings'] });
        void queryClient.invalidateQueries({ queryKey: ['calendar'] });
        void queryClient.invalidateQueries({ queryKey: ['today'] });
        void queryClient.invalidateQueries({ queryKey: ['units'] });
      } else if (domain === 'payments') {
        void queryClient.invalidateQueries({ queryKey: ['payments'] });
        void queryClient.invalidateQueries({ queryKey: ['bookings'] });
        void queryClient.invalidateQueries({ queryKey: ['today'] });
      } else if (domain === 'guests') {
        void queryClient.invalidateQueries({ queryKey: ['guests'] });
      } else if (domain === 'units' || domain === 'blocks') {
        void queryClient.invalidateQueries({ queryKey: ['units'] });
        void queryClient.invalidateQueries({ queryKey: ['calendar'] });
        void queryClient.invalidateQueries({ queryKey: ['today'] });
        void queryClient.invalidateQueries({ queryKey: ['blocks'] });
      } else {
        void queryClient.invalidateQueries({ queryKey: [domain] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  // 2. Realtime Multi-Device synchronization via Supabase Realtime WebSocket
  useEffect(() => {
    if (!supabase) return;

    const triggerInvalidation = (domain: SyncDomain) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (domain === 'bookings') {
          void queryClient.invalidateQueries({ queryKey: ['bookings'] });
          void queryClient.invalidateQueries({ queryKey: ['calendar'] });
          void queryClient.invalidateQueries({ queryKey: ['today'] });
          void queryClient.invalidateQueries({ queryKey: ['units'] });
        } else if (domain === 'payments') {
          void queryClient.invalidateQueries({ queryKey: ['payments'] });
          void queryClient.invalidateQueries({ queryKey: ['bookings'] });
          void queryClient.invalidateQueries({ queryKey: ['today'] });
        } else if (domain === 'guests') {
          void queryClient.invalidateQueries({ queryKey: ['guests'] });
        } else if (domain === 'units') {
          void queryClient.invalidateQueries({ queryKey: ['units'] });
          void queryClient.invalidateQueries({ queryKey: ['calendar'] });
        }
        // Also notify other open tabs
        broadcastDataChange(domain);
      }, 150);
    };

    const realtimeChannel = supabase
      .channel('almagd-db-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        triggerInvalidation('bookings');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        triggerInvalidation('payments');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => {
        triggerInvalidation('guests');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => {
        triggerInvalidation('units');
      })
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (supabase) {
        void supabase.removeChannel(realtimeChannel);
      }
    };
  }, [queryClient]);

  return <>{children}</>;
};
