import type { Uint8Array_ } from './types.ts';

/**
 * Performs AES-GCM encryption on the provided data using the given encryption key.
 * The function generates a random initialization vector (IV) for the encryption process.
 */
export async function encryptAESGCM(
  data: Uint8Array_,
  encryptionKey: CryptoKey,
): Promise<[ciphertext: Uint8Array_, iv: Uint8Array_]> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    data,
  );

  return [new Uint8Array(encrypted), iv];
}
