import { base64url } from './index.ts';

/**
 * Generate a random value suitable for use as a nonce to prevent replay attacks
 */
export function generateNonce(): string {
  const nonce = new Uint8Array(32);

  globalThis.crypto.getRandomValues(nonce);

  const nonceString = base64url.bufferToBase64URL(nonce);

  return _generateNonceInternals.stubThis(nonceString);
}

/**
 * Make it possible to stub the return value during testing
 * @ignore Don't include this in docs output
 */
export const _generateNonceInternals = {
  stubThis: (value: string) => value,
};
