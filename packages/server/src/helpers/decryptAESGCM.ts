import { SimpleDigiCredsError } from './index.ts';
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
  let decrypted: ArrayBuffer;

  try {
    decrypted = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      ciphertext,
    );
  } catch (err) {
    const _err = err as Error;
    throw new SimpleDigiCredsError({
      message: `Failed to decrypt data`,
      code: 'SubtleCryptoError',
      cause: _err,
    });
  }

  return new Uint8Array(decrypted);
}
