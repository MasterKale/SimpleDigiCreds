import type { Uint8Array_ } from './types.ts';

/**
 * Performs AES-GCM decryption on the provided data using the given encryption key and
 * initialization vector (IV).
 */
export async function decryptAESGCM(
  ciphertext: Uint8Array_,
  iv: Uint8Array_,
  encryptionKey: CryptoKey,
): Promise<Uint8Array_> {
  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    ciphertext,
  );

  return new Uint8Array(decrypted);
}
