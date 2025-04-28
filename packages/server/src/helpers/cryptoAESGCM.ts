import { SimpleDigiCredsError } from './index.ts';
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

  let encrypted: ArrayBuffer;
  try {
    encrypted = await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      encryptionKey,
      data,
    );
  } catch (err) {
    const _err = err as Error;
    throw new SimpleDigiCredsError({
      message: `Failed to encrypt data`,
      code: 'SubtleCryptoError',
      cause: _err,
    });
  }

  return [new Uint8Array(encrypted), iv];
}

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

/**
 * Generate a key we can use for AES-GCM 256-bit encryption and decryption
 */
export function importAESGCMKey(keySecret: Uint8Array_): Promise<CryptoKey> {
  if (keySecret?.length !== 32) {
    throw new SimpleDigiCredsError({
      message: 'AES key secret was not 32 bytes',
      code: 'InvalidDCAPIResponse',
    });
  }

  try {
    return globalThis.crypto.subtle.importKey(
      'raw',
      keySecret,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  } catch (err) {
    const _err = err as Error;
    throw new SimpleDigiCredsError({
      message: `Failed to import AES-GCM key`,
      code: 'SubtleCryptoError',
      cause: _err,
    });
  }
}
