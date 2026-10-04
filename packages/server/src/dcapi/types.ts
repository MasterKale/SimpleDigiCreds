import type { OID4VPClientMetadata, OID4VPDCQLQuery } from '../protocols/oid4vp/types.ts';

/**
 * Options suitable for passing directly into `navigator.credentials.get()` in the browser to
 * request the presentation of a verifiable credential via the Digital Credentials API
 */
export type CredentialRequestOptions = {
  digital: DigitalCredentialRequestOptions;
};

export type DigitalCredentialRequestOptions = {
  requests: DigitalCredentialRequest[];
};

export type DigitalCredentialRequest = {
  /** https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-A.1 */
  protocol: 'openid4vp-v1-unsigned';
  data: DCAPIRequestOID4VP;
};
/**
 * Credential-agnostic OID4VP-specific request parameters
 *
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-A.2
 */
export type DCAPIRequestOID4VP = {
  /** The value `"vp_token"` */
  response_type: 'vp_token';
  /** The value `"dc_api"` (when unencrypted) or `"dc_api.jwt"` (when encrypted) */
  response_mode: 'dc_api' | 'dc_api.jwt';
  /** Only used for signed requests (not currently supported) */
  client_id?: string;
  /** Base64URL-encoded random bytes to ensure uniqueness of the presentation */
  nonce: string;
  /** The credentials being requested */
  dcql_query: OID4VPDCQLQuery;
  client_metadata?: OID4VPClientMetadata;
};

/**
 * The shape of the value returned from a call to `navigator.credentials.get({ digital: { ... } })`.
 * Each entry in `vp_token` is keyed by a Credential Query `id` and contains an array of one or
 * more presentations
 *
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-8.1
 */
export type DCAPIResponse = {
  vp_token: { [credID: string]: string[] };
};

/**
 * The shape of the value returned from a call to `navigator.credentials.get({ digital: { ... } })`
 * when the response is an encrypted JWT (JWE)
 */
export type DCAPIEncryptedResponse = {
  response: string;
};

/**
 * The shape of the value returned from a call to `navigator.credentials.get({ digital: { ... } })`
 * when the Wallet returns an error in response to an OID4VP presentation request.
 *
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-A.4
 */
export type DCAPIWalletErrorOID4VP = {
  /** Ex: `"access_denied"`, `"invalid_request"`, `"vp_formats_not_supported"` */
  error: string;
  error_description?: string;
};
