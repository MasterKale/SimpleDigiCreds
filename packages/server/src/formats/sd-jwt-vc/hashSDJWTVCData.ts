import type { Uint8Array_ } from '../../helpers/types.ts';

/**
 * A version of @sd-jwt/crypto-browser and @sd-jwt/crypto-nodejs that...
 *
 * 1. Doesn't use `node:crypto`
 * 2. Doesn't use `window.crypto`
 */
export async function hashSDJWTVCData(
  data: string | ArrayBuffer,
  algorithm: string = 'sha-256',
): Promise<Uint8Array_> {
  if (typeof data === 'string') {
    data = (new TextEncoder().encode(data) as Uint8Array_).buffer;
  }

  const digest = await globalThis.crypto.subtle.digest(algorithm, data);

  return new Uint8Array(digest);
}
