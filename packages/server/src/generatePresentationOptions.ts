import { generateNonce } from './helpers/index.ts';
import type {
  OID4VPCredentialQueryMdoc,
  OID4VPCredentialQuerySDJWT,
  OID4VPSupportedMdocClaimName,
} from './protocols/oid4vp.ts';
import type { CredentialRequestOptions } from './dcapi.ts';

/**
 * Generate credential presentation request options suitable for passing into
 * `navigator.credentials.get()` as per the Digital Credentials API.
 *
 * Supported Protocols:
 * - OID4VP
 *
 * Supported Document Formats:
 * - mdoc
 */
export function generatePresentationOptions(
  { desiredClaims, requestOrigin }: {
    desiredClaims: OID4VPSupportedMdocClaimName[];
    requestOrigin: string;
  },
): CredentialRequestOptions {
  const mdocCredentialRequest: OID4VPCredentialQueryMdoc = {
    id: 'cred1',
    format: 'mso_mdoc',
    meta: {
      doctype_value: 'org.iso.18013.5.1.mDL',
    },
    claims: desiredClaims.map((claimName) => ({
      path: ['org.iso.18013.5.1', claimName],
    })),
  };

  const sdjwtCredentialRequest: OID4VPCredentialQuerySDJWT = {
    id: 'cred1',
    format: 'dc+sd-jwt',
    meta: {
      // TODO: This can't be hardcoded...how do we let users specify it?
      // DEBUG: Just for CMWallet
      vct_values: ['urn:eu.europa.ec.eudi:pid:1'],
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

  return {
    digital: {
      requests: [
        {
          // https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#name-protocol
          protocol: 'openid4vp',
          data: {
            response_type: 'vp_token',
            response_mode: 'dc_api',
            client_id: `web-origin:${requestOrigin}`,
            nonce: generateNonce(),
            // https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#dcql_query
            dcql_query: {
              credentials: [
                mdocCredentialRequest,
              ],
            },
          },
        },
      ],
    },
  };
}
