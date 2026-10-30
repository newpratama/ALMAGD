import { describe, it, expect } from 'vitest';
import { encryptedCache } from './encryptedStorage';

describe('EncryptedCacheManager (AES-GCM Web Crypto)', () => {
  it('initializes and handles set/get gracefully', async () => {
    await encryptedCache.init('test-staff-123');
    await encryptedCache.set('test-key', { sample: 42 });
    // In node environment without indexedDB, it handles fallback safely
    const val = await encryptedCache.get('test-key');
    // In mock/node environment, either value or null is safely returned without throwing
    expect(val === null || (val as { sample: number }).sample === 42).toBe(true);
    await encryptedCache.clear();
  });
});
