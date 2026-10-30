import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

export type StaffRole = 'manager' | 'reception';
export type StaffMember = Database['public']['Tables']['staff']['Row'];

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  staff: StaffMember | null;
  role: StaffRole | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaffData = useCallback(async (userId: string): Promise<StaffMember | null> => {
    if (!supabase) return null;
    const { data, error: staffErr } = await supabase
      .from('staff')
      .select('*')
      .eq('id', userId)
      .eq('active', true)
      .maybeSingle();

    if (staffErr || !data) {
      return null;
    }
    return data as StaffMember;
  }, []);

  const handleSession = useCallback(
    async (currentSession: Session | null) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (!currentSession?.user) {
        setStaff(null);
        setLoading(false);
        return;
      }

      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const staffRow = await fetchStaffData(currentSession.user.id);
        if (!staffRow) {
          // User exists in auth but has no active staff row
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setStaff(null);
          setError('errors.notStaff');
        } else {
          setStaff(staffRow);
          setError(null);
        }
      } catch (e) {
        console.error('Failed to fetch staff record:', e);
        setStaff(null);
        setError('errors.unknown');
      } finally {
        setLoading(false);
      }
    },
    [fetchStaffData]
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Initial check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      handleSession(initialSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      handleSession(currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setStaff(null);
    setError(null);
  }, []);

  const refreshStaff = useCallback(async () => {
    if (user) {
      const refreshed = await fetchStaffData(user.id);
      setStaff(refreshed);
    }
  }, [user, fetchStaffData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const role: StaffRole | null = staff?.role === 'manager' || staff?.role === 'reception' ? staff.role : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        staff,
        role,
        loading,
        error,
        signOut,
        clearError,
        refreshStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
