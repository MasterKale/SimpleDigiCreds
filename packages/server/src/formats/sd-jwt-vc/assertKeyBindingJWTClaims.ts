import type { kbPayload } from '@sd-jwt/types';

import { SimpleDigiCredsError } from '../../helpers/index.ts';

/**
 * Check Key Binding JWT claims for correctness
 *
 * @raises `SimpleDigiCredsError` with whatever claim was invalid
 */
export function assertKeyBindingJWTClaims({
  payload,
  expectedClientID,
  expectedNonce,
}: {
  payload: kbPayload;
  expectedClientID: string;
  expectedNonce: string;
}): void {
  // Verify `iat`
  const issuedAtDate = new Date(payload.iat * 1000);
  const currentDate = new Date();

  if (issuedAtDate > currentDate) {
    throw new SimpleDigiCredsError({
      message: 'Key Binding JWT was issued in the future',
      code: 'SDJWTVerificationError',
    });
  }

  // Verify `aud`
  if (payload.aud !== expectedClientID) {
    throw new SimpleDigiCredsError({
      message:
        `Key Binding JWT audience "${payload.aud}" did not match expected client_id "${expectedClientID}"`,
      code: 'SDJWTVerificationError',
    });
  }

  // Verify `nonce`
  if (payload.nonce !== expectedNonce) {
    throw new SimpleDigiCredsError({
      message:
        `Key Binding JWT expectedNonce "${payload.nonce}" did not match expected nonce "${expectedNonce}"`,
      code: 'SDJWTVerificationError',
    });
  }
}
