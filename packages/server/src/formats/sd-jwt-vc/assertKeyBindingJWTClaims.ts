import type { kbPayload } from '@sd-jwt/types';

import { SimpleDigiCredsError } from '../../helpers/index.ts';

/** */
export function assertKeyBindingJWTClaims({
  payload,
  clientID,
  nonce,
}: {
  payload: kbPayload;
  clientID: string;
  nonce: string;
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
  if (payload.aud !== clientID) {
    throw new SimpleDigiCredsError({
      message: `Key Binding JWT audience "${payload.aud}" did not match client_id "${clientID}"`,
      code: 'SDJWTVerificationError',
    });
  }

  // Verify `nonce`
  if (payload.nonce !== nonce) {
    throw new SimpleDigiCredsError({
      message: `Key Binding JWT nonce "${payload.nonce}" did not match nonce "${nonce}"`,
      code: 'SDJWTVerificationError',
    });
  }
}
