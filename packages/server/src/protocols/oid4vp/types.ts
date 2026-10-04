import type { Identifier } from '../../formats/mdoc/types.ts';

/**
 * 6.1. Credential Query
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6.1
 */
export type OID4VPCredentialQuery = {
  /** A unique string comprised of alphanumeric, underscore (_) or hyphen (-) characters */
  id: string;
  /** The format of the requested Verifiable Credential */
  format: string;
  /** Whether multiple credentials can be returned for this query. Defaults to `false` */
  multiple?: boolean;
  /** Format-specific metadata */
  meta?: unknown;
  claims?: OID4VPClaimQuery[];
  /**
   * TODO: A list of trusted authorities or trust frameworks that certify the Issuers of
   * credentials that the Verifier will accept for this request.
   * https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#dcql_trusted_authorities
   */
  trusted_authorities?: unknown[];
  /**
   * Whether the Verifier requires a cryptographic proof that the wallet holds the credential.
   * Defaults to `true`
   */
  require_cryptographic_holder_binding?: boolean;
};

export type OID4VPCredentialQueryMdoc = OID4VPCredentialQuery & {
  /** https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.2 */
  format: 'mso_mdoc';
  /** https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.2.3 */
  meta: { doctype_value: string };
  claims: OID4VPClaimQueryMdoc[];
};

/** https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.2 */
export type OID4VPCredentialQueryMDL = OID4VPCredentialQueryMdoc & {
  /** https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.2.3 */
  meta: { doctype_value: 'org.iso.18013.5.1.mDL' };
};

/** https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.3 */
export type OID4VPCredentialQuerySDJWTVC = OID4VPCredentialQuery & {
  format: 'dc+sd-jwt';
  meta?: {
    /**
     * An array of strings that specifies allowed values for the type of the requested Verifiable Credential.
     * https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#appendix-B.3.5
     */
    vct_values: string[];
  };
  claims: OID4VPClaimQuery[];
};

/**
 * 6.3. Claims Query
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6.3
 */
export type OID4VPClaimQuery = {
  /** An array of strings indicating a property within a JSON credential format. See {@link PathPointer} for more info */
  path: PathPointer;
  /** A unique string comprised of alphanumeric, underscore (_) or hyphen (-) characters. REQUIRED if `claim_sets` is present */
  id?: string;
  /** Expected values for this claim. This claim will only be returned if the wallet can match one of these values */
  values?: (string | number | boolean)[];
};

/**
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.2.4
 */
export type OID4VPClaimQueryMdoc = OID4VPClaimQuery & {
  /** A boolean that is equivalent to IntentToRetain variable defined in the mdoc specification */
  intent_to_retain?: boolean;
};

/**
 * An array of strings, with each string representing one level deeper within a JSON-like structure.
 *
 * For example, for the following document...
 *
 * ```json
 * {
 *   "address": {
 *     "street_address": "42 Market Street",
 *     "locality": "Milliways",
 *     "postal_code": "12345"
 *   }
 * }
 * ```
 *
 * ...the path pointer to the value `"42 Market Street"` would be `["address", "street_address"]`
 */
export type PathPointer = string[];

/**
 * Valid mdoc identifiers that can be used in an OID4VP request as a value for `claim_name`
 */
export type OID4VPSupportedMDLClaimName = Exclude<Identifier, 'age_over_NN'> | 'age_over_21';

/**
 * Verifier metadata values. See
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-5.1
 */
export type OID4VPClientMetadata = {
  /**
   * Public keys the Wallet can use to encrypt the response. Each JWK MUST have a `kid`, and `alg`
   * MUST be present so the Wallet knows which JWE `alg` to use.
   *
   * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-8.3
   */
  jwks?: {
    keys: OID4VPResponseEncryptionJWK[];
  };
  /**
   * The shape of this depends on the type of credential being requested
   */
  vp_formats_supported: unknown;
  /**
   * From https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-5.1:
   *
   * > When a response_mode requiring encryption of the Response (such as dc_api.jwt...) is
   * > specified, this MUST be present for anything other than the default single value of
   * > A128GCM. Otherwise, this SHOULD be absent.
   *
   * HAIP additionally requires Verifiers to list both `A128GCM` and `A256GCM`:
   * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-5
   */
  encrypted_response_enc_values_supported?: JWEENC[];
};

/**
 * A public key JWK suitable for inclusion in `client_metadata.jwks` for response encryption
 */
export type OID4VPResponseEncryptionJWK = JsonWebKey & {
  kid: string;
  alg: JWEALG_HAIP;
  use?: 'enc';
};

/**
 * JWS [RFC7515] `alg` algorithms. Recommended+ values. See
 * https://www.iana.org/assignments/jose/jose.xhtml#web-signature-encryption-algorithms
 */
// Uncomment when we support request signing
// type JWSALG = 'ECDH-ES' | 'RSA-OAEP' | 'ES256';

/**
 * JWE [RFC7516] `alg` algorithms. Required and Recommended+ values. See
 * https://www.iana.org/assignments/jose/jose.xhtml#web-signature-encryption-algorithms
 */
type JWEALG = 'HS256' | 'ECDH-ES' | 'RSA-OAEP' | 'ES256';
/**
 * JWE [RFC7516] `alg` algorithms required by OID4VC HAIP. See
 * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-5
 */
export type JWEALG_HAIP = Extract<JWEALG, 'ECDH-ES'>;

/**
 * JWE [RFC7516] `enc` algorithms. Required and Recommended values. See
 * https://www.rfc-editor.org/rfc/rfc7518.html#section-5.1
 */
export type JWEENC = 'A128CBC-HS256' | 'A256CBC-HS512' | 'A128GCM' | 'A256GCM';
/**
 * JWE [RFC7516] `enc` algorithms required by OID4VC HAIP. See
 * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-5
 */
export type JWEENC_HAIP = Extract<JWEENC, 'A128GCM' | 'A256GCM'>;

/**
 * The shape of `client_metadata` when requesting an mdoc. See
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.2.2
 */
export type OID4VPClientMetadataMdoc = OID4VPClientMetadata & {
  vp_formats_supported: {
    'mso_mdoc': {
      issuerauth_alg_values: [-7];
      deviceauth_alg_values: [-7];
    };
  };
};

/**
 * The shape of `client_metadata` when requesting an SD-JWT-VC. See
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.3.4
 */
export type OID4VPClientMetadataSDJWTVC = OID4VPClientMetadata & {
  vp_formats_supported: {
    'dc+sd-jwt': {
      'sd-jwt_alg_values': ['ES256'];
      'kb-jwt_alg_values': ['ES256'];
    };
  };
};
