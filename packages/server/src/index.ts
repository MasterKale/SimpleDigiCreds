import { generateNonce } from './crypto/index.ts';

/**
 * - Tieing together DC API (browser), OID4VP (protocol), and mdoc (document format)
 * - Unsigned requests only for now
 */
type ClaimName = 'familyName' | 'givenName' | 'ageOver21';

/**
 * Generate credential presentation request options suitable for passing into
 * `navigator.credentials.get()` as per the Digital Credentials API. Only supports OID4VP + mdoc
 * right now.
 */
export function generateRequestOptions(
  { desiredClaims, requestOrigin }: { desiredClaims: ClaimName[]; requestOrigin: string },
) {
  return {
    digital: {
      requests: [
        {
          response_type: 'vp_token',
          response_mode: 'dc_api',
          client_id: `web-origin:${requestOrigin}`,
          nonce: generateNonce(),
          // https://openid.github.io/OpenID4VP/openid-4-verifiable-presentations-wg-draft.html#dcql_query
          dcql_query: {
            credentials: [
              {
                id: 'cred1',
                format: 'mso_mdoc',
                meta: {
                  doctype_value: 'org.iso.18013.5.1.mDL',
                },
                claims: desiredClaims.map((claimName) => ({
                  namespace: 'org.iso.18013.5.1',
                  claim_name: toMdocClaimName(claimName),
                })),
              },
            ],
          },
        },
      ],
    },
  };
}

function toMdocClaimName(claimName: ClaimName) {
  if (claimName === 'familyName') {
    return 'family_name';
  }

  if (claimName === 'givenName') {
    return 'given_name';
  }

  if (claimName === 'ageOver21') {
    return 'age_over_21';
  }

  throw new Error(`Unrecognized ClaimName "${claimName}"`);
}
