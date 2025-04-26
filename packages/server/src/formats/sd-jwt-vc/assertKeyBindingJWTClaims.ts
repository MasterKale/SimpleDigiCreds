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
  // Add 1 second to the current date to account for clock skew
  const currentDatePlus1Second = new Date(currentDate.getTime() + 1000);

  if (issuedAtDate > currentDatePlus1Second) {
    const iatISO = issuedAtDate.toISOString();
    const currentISO = currentDatePlus1Second.toISOString();
    throw new SimpleDigiCredsError({
      message: `Key Binding JWT was issued at (${iatISO}), after the current date (${currentISO})`,
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
