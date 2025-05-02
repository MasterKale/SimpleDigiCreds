import type { OID4VPClientMetadataSDJWTVC, OID4VPCredentialQuerySDJWTVC } from './types.ts';

/**
 * Generate an SD-JWT-VC-specific set of request options for the Digital Credentials API
 *
 * References:
 * - https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#name-ietf-sd-jwt-vc
 * - https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html
 * - https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-08.html
 */
export function generateSDJWTRequestOptions({
  id,
  desiredClaims,
  acceptedVCTValues,
}: {
  id: string;
  desiredClaims: (string | string[])[];
  acceptedVCTValues: string[];
}): {
  credentialQuery: OID4VPCredentialQuerySDJWTVC;
  clientMetadata: OID4VPClientMetadataSDJWTVC;
} {
  return {
    credentialQuery: {
      id,
      format: 'dc+sd-jwt',
      meta: {
        vct_values: acceptedVCTValues,
      },
      claims: desiredClaims.map((claimName) => {
        if (Array.isArray(claimName)) {
          return { path: claimName };
        } else {
          return { path: [claimName] };
        }
      }),
    },
    clientMetadata: {
      vp_formats_supported: {
        'dc+sd-jwt': {
          'sd-jwt_alg_values': ['ES256'],
          'kb-jwt_alg_values': ['ES256'],
        },
      },
    },
  };
}
