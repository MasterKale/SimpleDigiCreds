import type { Uint8Array_ } from './types.ts';

/**
 * Generate a key we can use for AES-GCM 256-bit encryption and decryption
 */
export function importAESGCMKey(keyData: Uint8Array_): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}
