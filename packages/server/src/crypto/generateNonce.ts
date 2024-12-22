import { encodeBase64Url } from '@std/encoding';

/**
 * Generate a random value suitable for use as a nonce to prevent replay attacks
 */
export function generateNonce() {
  const nonce = new Uint8Array(32);

  globalThis.crypto.getRandomValues(nonce);

  const nonceString = encodeBase64Url(nonce);

  return _generateNonceInternals.stubThis(nonceString);
}

/**
 * Make it possible to stub the return value during testing
 * @ignore Don't include this in docs output
 */
export const _generateNonceInternals = {
  stubThis: (value: string) => value,
};
