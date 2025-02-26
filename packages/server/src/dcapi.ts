import type { OID4VPClaimQuery, OID4VPCredentialQueryMdoc } from './protocols/oid4vp.ts';

/**
 * OID4VP-specific request parameters
 *
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-A.2
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
 * Options suitable for passing into `navigator.credentials.get({ digital: { ... } })` in the
 * browser to request the presentation of a verifiable credential via the Digital Credentials API
 */
export type DCAPIRequestOptions = {
  digital: {
    requests: DCAPIRequestOID4VP[];
  };
};

/**
 * The shape of the value returned from a call to `navigator.credentials.get({ digital: { ... } })`
 */
export type DCAPIResponse = {
  vp_token: { [key: string]: string };
};
