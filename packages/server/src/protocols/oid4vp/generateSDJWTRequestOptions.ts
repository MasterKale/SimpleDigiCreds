import type { OID4VPCredentialQuerySDJWT } from './types.ts';

/**
 * Generate an SD-JWT-VC-specific set of request options for the Digital Credentials API
 *
 * References:
 * - https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#name-ietf-sd-jwt-vc
 * - https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html
 * - https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-08.html
 */
export function generateSDJWTRequestOptions({
  id,
  desiredClaims,
  acceptedVCTValues,
}: {
  id: string;
  desiredClaims: string[];
  acceptedVCTValues?: string[];
}): OID4VPCredentialQuerySDJWT {
  return {
    id,
    format: 'dc+sd-jwt',
    meta: {
      vct_values: acceptedVCTValues,
    },
    claims: desiredClaims.map((claimName) => ({
      path: [claimName],
    })),
    client_metadata: {
      vp_formats: {
        'dc+sd-jwt': {
          'sd-jwt_alg_values': ['ES256'],
          'kb-jwt_alg_values': ['ES256'],
        },
      },
    },
  };
}
