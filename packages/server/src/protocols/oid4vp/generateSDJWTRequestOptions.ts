import type { OID4VPClientMetadataSDJWTVC, OID4VPCredentialQuerySDJWTVC } from './types.ts';

/**
 * Generate an SD-JWT-VC-specific set of request options for the Digital Credentials API
 *
 * References:
 * - https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.3
 * - https://www.rfc-editor.org/rfc/rfc9901.html
 * - https://datatracker.ietf.org/doc/html/draft-ietf-oauth-sd-jwt-vc-13
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
