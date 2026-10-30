import { describe, expect, it } from 'vitest';
import { friendlyError } from './errors';

describe('friendlyError', () => {
  it('maps PostgreSQL exclusion violation to unitNotAvailable', () => {
    expect(friendlyError({ code: '23P01', message: 'exclusion violation' })).toBe(
      'errors.unitNotAvailable'
    );
  });

  it('maps 42501 and RLS errors to forbidden', () => {
    expect(friendlyError({ code: '42501', message: 'permission denied' })).toBe(
      'errors.forbidden'
    );
    expect(
      friendlyError({ message: 'new row violates row-level security policy for table "staff"' })
    ).toBe('errors.forbidden');
  });

  it('maps check violations to invalidData', () => {
    expect(friendlyError({ code: '23514', message: 'check constraint violation' })).toBe(
      'errors.invalidData'
    );
  });

  it('maps foreign key violations to inUse', () => {
    expect(friendlyError({ code: '23503', message: 'foreign key constraint' })).toBe(
      'errors.inUse'
    );
  });

  it('maps network failures to network', () => {
    expect(friendlyError(new Error('Failed to fetch'))).toBe('errors.network');
    expect(friendlyError('Network request failed')).toBe('errors.network');
  });

  it('defaults to unknown error for other conditions', () => {
    expect(friendlyError({ code: 'XX000', message: 'Internal error' })).toBe('errors.unknown');
    expect(friendlyError(null)).toBe('errors.unknown');
    expect(friendlyError(undefined)).toBe('errors.unknown');
  });
});
