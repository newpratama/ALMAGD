import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

const url = 'http://127.0.0.1:54321';
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

describe('Auth & Staff verification', () => {
  it('authenticates manager test user and verifies manager role', async () => {
    const client = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: 'manager@almagd.test',
      password: 'password123',
    });

    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();
    expect(authData.user?.email).toBe('manager@almagd.test');

    const { data: staffData, error: staffError } = await client
      .from('staff')
      .select('*')
      .eq('id', authData.user!.id)
      .single();

    expect(staffError).toBeNull();
    expect(staffData?.role).toBe('manager');
    expect(staffData?.active).toBe(true);
  });

  it('authenticates reception test user and verifies reception role', async () => {
    const client = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: 'reception@almagd.test',
      password: 'password123',
    });

    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();
    expect(authData.user?.email).toBe('reception@almagd.test');

    const { data: staffData, error: staffError } = await client
      .from('staff')
      .select('*')
      .eq('id', authData.user!.id)
      .single();

    expect(staffError).toBeNull();
    expect(staffData?.role).toBe('reception');
    expect(staffData?.active).toBe(true);
  });

  it('rejects invalid password', async () => {
    const client = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await client.auth.signInWithPassword({
      email: 'manager@almagd.test',
      password: 'wrongpassword',
    });

    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });
});
