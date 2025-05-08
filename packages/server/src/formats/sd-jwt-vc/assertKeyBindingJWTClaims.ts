import type { kbPayload } from '@sd-jwt/types';

import { SimpleDigiCredsError } from '../../helpers/index.ts';

/**
 * Check Key Binding JWT claims for correctness
 *
 * @raises `SimpleDigiCredsError` with whatever claim was invalid
 */
export function assertKeyBindingJWTClaims({
  payload,
  nonce,
  possibleOrigins,
}: {
  payload: kbPayload;
  nonce: string;
  possibleOrigins: string[];
}): { verifiedOrigin: string } {
  // Verify `iat`
  const issuedAtDate = new Date(payload.iat * 1000);
  const currentDate = new Date();
  // Add 1 second to the current date to account for clock skew
  const currentDatePlusSkew = new Date(currentDate.getTime() + 1500);

  if (issuedAtDate > currentDatePlusSkew) {
    const iatISO = issuedAtDate.toISOString();
    const currentISO = currentDatePlusSkew.toISOString();
    throw new SimpleDigiCredsError({
      message: `Key Binding JWT was issued at (${iatISO}), after the current date (${currentISO})`,
      code: 'SDJWTVerificationError',
    });
  }

  // Verify `aud`
  let verifiedAUD = false;
  let verifiedOrigin = '';
  for (const origin of possibleOrigins) {
    /** https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#appendix-A.4-6 */
    if (payload.aud === `origin:${origin}`) {
      verifiedAUD = true;
      verifiedOrigin = origin;
      break;
    }
  }

  if (!verifiedAUD) {
    throw new SimpleDigiCredsError({
      message: `Key Binding JWT audience "${payload.aud}" did not match any expected client IDs`,
      code: 'SDJWTVerificationError',
    });
  }

  // Verify `nonce`
  if (payload.nonce !== nonce) {
    throw new SimpleDigiCredsError({
      message:
        `Key Binding JWT expectedNonce "${payload.nonce}" did not match expected nonce "${nonce}"`,
      code: 'SDJWTVerificationError',
    });
  }

  return { verifiedOrigin };
}
