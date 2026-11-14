import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { supabase } from '../lib/supabase';
import { fetchUnits, fetchAvailableUnits } from './units';
import { fetchBookingSources } from './bookings';
import { createGuest, deleteGuest, searchGuests } from './guests';

describe('API functions integration with Supabase local', () => {
  beforeAll(async () => {
    if (supabase) {
      // Sign in to satisfy RLS is_staff() policy
      await supabase.auth.signInWithPassword({
        email: 'newpratama25@gmail.com',
        password: '1NP.A@M.com',
      });
    }
  });

  afterAll(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  });

  it('fetchUnits returns all 96 units (24 villas + 72 rooms)', async () => {
    const units = await fetchUnits();
    expect(units.length).toBe(96);

    const villas = units.filter((u) => u.kind === 'villa');
    const rooms = units.filter((u) => u.kind === 'room');
    expect(villas.length).toBe(24);
    expect(rooms.length).toBe(72);
  });

  it('fetchAvailableUnits returns units for open future dates', async () => {
    const available = await fetchAvailableUnits('2035-01-01', '2035-01-05');
    expect(available.length).toBeGreaterThan(0);
  });

  it('fetchBookingSources returns standard booking sources', async () => {
    const sources = await fetchBookingSources();
    expect(sources.length).toBe(6);
    const codes = sources.map((s) => s.code);
    expect(codes).toContain('walk_in');
    expect(codes).toContain('tiket');
    expect(codes).toContain('booking');
  });

  it('searchGuests returns array without error', async () => {
    const results = await searchGuests('');
    expect(Array.isArray(results)).toBe(true);
  });

  it('createGuest inserts a new guest cleanly and deleteGuest cleans up', async () => {
    const created = await createGuest({
      full_name: '__vitest_temp_guest__',
      phone: null,
      email: null,
      nationality: 'Saudi Arabia',
      id_type: 'passport',
      id_number: null,
      tags: [],
      notes: null,
    });
    try {
      expect(created.id).toBeTruthy();
      expect(created.full_name).toBe('__vitest_temp_guest__');
      expect(created.nationality).toBe('Saudi Arabia');
    } finally {
      await deleteGuest(created.id);
    }
  });
});
