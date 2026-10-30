/**
 * Cross-tab synchronization via native BroadcastChannel, inspired by OUD enterprise architecture.
 * Automatically broadcasts mutation signals across open tabs to keep calendar, today KPIs,
 * bookings, units, and payments 100% in sync without manual page reloads.
 */

export type SyncDomain = 'bookings' | 'payments' | 'guests' | 'units' | 'calendar' | 'today' | 'blocks' | 'all';

interface SyncMessage {
  type: 'ALMAGD_DATA_CHANGED';
  domain: SyncDomain;
  timestamp: number;
}

const CHANNEL_NAME = 'almagd-sync-v1';
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined') return null;
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      channel = null;
    }
  }
  return channel;
}

export function broadcastDataChange(domain: SyncDomain = 'all'): void {
  const ch = getChannel();
  if (ch) {
    const msg: SyncMessage = {
      type: 'ALMAGD_DATA_CHANGED',
      domain,
      timestamp: Date.now(),
    };
    try {
      ch.postMessage(msg);
    } catch {
      // Channel might be closed or detached
    }
  }
}

export function subscribeToCrossTabSync(callback: (domain: SyncDomain) => void): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const handler = (event: MessageEvent<SyncMessage>) => {
    if (event.data && event.data.type === 'ALMAGD_DATA_CHANGED') {
      callback(event.data.domain);
    }
  };

  ch.addEventListener('message', handler);
  return () => {
    ch.removeEventListener('message', handler);
  };
}
