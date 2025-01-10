import { generateNonce } from './crypto/index.ts';
import type {
  OID4VPClaimQuery,
  OID4VPCredentialQueryMdoc,
  OID4VPSupportedMdocClaimName,
} from './oid4vp.ts';

/**
 * OID4VP-specific request parameters
 *
 * https://openid.github.io/OpenID4VP/openid-4-verifiable-presentations-wg-draft.html#appendix-A.2
 */
export type DCAPIRequestOID4VP = {
  /** The value `"vp_token"` */
  response_type: 'vp_token';
  /** The value `"dc_api"` */
  response_mode: 'dc_api';
  /** Ex: `"web-origin:https://example.com"` */
  client_id: string;
  /** Base64URL-encoded random bytes to ensure uniqueness of the presentation */
  nonce: string;
  /** An array of credentials being requested */
  dcql_query: {
    credentials: (OID4VPClaimQuery | OID4VPCredentialQueryMdoc)[];
  };
};

/**
 * Options suitable for passing into `navigator.credentials.get()` in the browser to request the
 * presentation of a verifiable credential via the Digital Credentials API
 */
export type DCAPIRequestOptions = {
  digital: {
    requests: DCAPIRequestOID4VP[];
  };
};

/**
 * Generate credential presentation request options suitable for passing into
 * `navigator.credentials.get()` as per the Digital Credentials API. Only supports OID4VP + mdoc
 * right now.
 *
 * - Tying together DC API (browser), OID4VP (protocol), and mdoc (document format)
 * - Unsigned requests only for now
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
      namespace: 'org.iso.18013.5.1',
      claim_name: claimName,
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
          // https://openid.github.io/OpenID4VP/openid-4-verifiable-presentations-wg-draft.html#dcql_query
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
