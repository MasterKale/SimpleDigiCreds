import { generateNonce } from './helpers/index.ts';
import type {
  OID4VPCredentialQueryMdoc,
  OID4VPSupportedMdocClaimName,
} from './protocols/oid4vp.ts';
import type { DCAPIRequestOptions } from './dcapi.ts';

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
export function generateRequestOptions(
  { desiredClaims, requestOrigin }: {
    desiredClaims: OID4VPSupportedMdocClaimName[];
    requestOrigin: string;
  },
): DCAPIRequestOptions {
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

  return {
    digital: {
      requests: [
        {
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
      ],
    },
  };
}
