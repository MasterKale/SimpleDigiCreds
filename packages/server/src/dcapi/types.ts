import type {
  OID4VPClientMetadata,
  OID4VPClientMetadataSDJWTVC,
  OID4VPCredentialQuery,
  OID4VPCredentialQueryMDL,
  OID4VPCredentialQuerySDJWTVC,
} from '../protocols/oid4vp/types.ts';

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
  protocol: string;
  data: DCAPIRequestOID4VP;
};
/**
 * Credential-agnostic OID4VP-specific request parameters
 *
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-A.2
 */
export type DCAPIRequestOID4VP = {
  /** The value `"vp_token"` */
  response_type: 'vp_token';
  /** The value `"dc_api"` (when unsigned and unencrypted) or `"dc_api.jwt"` (when signed or encrypted) */
  response_mode: 'dc_api' | 'dc_api.jwt';
  /** Ex: `"web-origin:https://example.com"` */
  client_id?: string;
  /** Base64URL-encoded random bytes to ensure uniqueness of the presentation */
  nonce: string;
  /** An array of credentials being requested */
  dcql_query: {
    credentials: OID4VPCredentialQuery[];
  };
  client_metadata?: OID4VPClientMetadata;
};

/**
 * OID4VP request parameters specific to requesting an mDL
 */
export type DCAPIRequestOID4VPMDL = DCAPIRequestOID4VP & {
  dcql_query: {
    credentials: OID4VPCredentialQueryMDL[];
  };
  client_metadata?: never;
};

/**
 * OID4VP request parameters specific to requesting an SD-JWT-VC
 */
export type DCAPIRequestOID4VPSDJWTVC = DCAPIRequestOID4VP & {
  dcql_query: {
    credentials: OID4VPCredentialQuerySDJWTVC[];
  };
  client_metadata: OID4VPClientMetadataSDJWTVC;
};

/**
 * The shape of the value returned from a call to `navigator.credentials.get({ digital: { ... } })`
 */
export type DCAPIResponse = {
  vp_token: { [key: string]: string };
};

/**
 * The shape of the value returned from a call to `navigator.credentials.get({ digital: { ... } })`
 * when the response is an encrypted JWT (JWE)
 */
export type DCAPIEncryptedResponse = {
  response: string;
};
