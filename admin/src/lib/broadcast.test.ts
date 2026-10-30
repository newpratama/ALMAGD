import { describe, it, expect, vi } from 'vitest';
import { broadcastDataChange, subscribeToCrossTabSync } from './broadcast';

describe('BroadcastChannel cross-tab sync', () => {
  it('allows subscription and clean unsubscription without error', () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToCrossTabSync(callback);
    expect(typeof unsubscribe).toBe('function');
    broadcastDataChange('bookings');
    unsubscribe();
  });
});
