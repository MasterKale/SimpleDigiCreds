import type { Identifier } from '../../formats/mdoc/types.ts';

/**
 * OID4VP: Protocol for requesting documents
 *
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#name-openid4vp-over-the-digital-
 *
 * A.1. Protocol
 *
 * To use OpenID4VP over the DC API, the value of the exchange protocol used with the Digital
 * Credentials API (DC API), is `openid4vp`.
 *
 * A.2. Request
 *
 * Out of the Authorization Request parameters defined in [RFC6749] and Section 5, the following are supported with OpenID4VP over the W3C Digital Credentials API:
 *
 * - client_id
 *   - MUST be omitted in unsigned requests defined in Appendix A.3.1. The Wallet determines the
 *     effective Client Identifier from the origin as asserted by the Web Platform and/or app
 *     platform.
 *   - The effective Client Identifier is composed of a synthetic Client Identifier Scheme of
 *     `web-origin` and the origin itself. For example, an origin of `https://verifier.example.com`
 *     would result in an effective Client Identifier of `web-origin:https://verifier.example.com`.
 * - response_type
 * - response_mode
 *   - The value of the response_mode parameter MUST be `dc_api` when the response is neither signed
 *     nor encrypted and `dc_api.jwt` when the response is signed and/or encrypted as defined in
 *     Section 7.3.
 * - nonce
 * - presentation_definition
 * - client_metadata
 * - request
 * - transaction_data
 * - dcql_query
 *
 * In addition to the above-mentioned parameters, a new parameter is introduced for OpenID4VP over
 * the W3C Digital Credentials API:
 *
 * - `expected_origins`
 *   - REQUIRED when signed requests defined in Appendix A.3.2 are used with the Digital
 *     Credentials API (DC API). An array of strings, each string representing an origin of the
 *     Verifier that is making the request. The Wallet can detect replay of the request from a
 *     malicious Verifier by comparing values in this parameter to the origin asserted by the Web
 *     Platform.
 *
 * B.3. Mobile Documents or mdocs (ISO/IEC 18013 and ISO/IEC 23220 series)
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-B.3
 *
 * - The Credential format identifier for Credentials in the mdoc format is `mso_mdoc`
 *
 * B.3.1.1. Parameters in the meta parameter in Credential Query
 *
 * The following is an ISO mdoc specific parameter in the meta parameter in a Credential Query as
 * defined in Section 6.1.
 *
 * - `doctype_value`: OPTIONAL. String that specifies an allowed value for the doctype of the
 *   requested Verifiable Credential. It MUST be a valid doctype identifier as defined in
 *   [ISO.18013-5].
 *
 * B.3.1.2. Parameters in the Claims Query
 *
 * The following are ISO mdoc specific parameters to be used in a Claims Query as defined in
 * Section 6.3.
 *
 * - `namespace`: REQUIRED if the Credential Format is based on the mdoc format defined in
 *   [ISO.18013-5]; MUST NOT be present otherwise. The value MUST be a string that specifies the
 *   namespace of the data element within the mdoc, e.g., org.iso.18013.5.1.
 * - `claim_name`: REQUIRED if the Credential Format is based on mdoc format defined in
 *   [ISO.18013-5]; MUST NOT be present otherwise. The value MUST be a string that specifies the
 *   data element identifier of the data element within the provided namespace in the mdoc, e.g.,
 *   first_name.
 */
/**
 * 6.1. Credential Query
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#section-6.1
 */
export type OID4VPCredentialQuery = {
  /** A unique string comprised of alphanumeric, underscore (_) or hyphen (-) characters */
  id: string;
  /** The format of the requested Verifiable Credential */
  format: string;
  /** Format-specific metadata */
  meta?: unknown;
  claims?: OID4VPClaimQuery[];
};

/** https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#name-mobile-documents-or-mdocs-i */
export type OID4VPCredentialQueryMdoc = {
  /** A unique string comprised of alphanumeric, underscore (_) or hyphen (-) characters */
  id: string;
  /** https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-B.3-2 */
  format: 'mso_mdoc';
  /** https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-B.3.1.1-2.2 */
  meta: { doctype_value: 'org.iso.18013.5.1.mDL' };
  claims: OID4VPClaimQueryMdoc[];
};

/** https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-B.4 */
export type OID4VPCredentialQuerySDJWT = {
  /** A unique string comprised of alphanumeric, underscore (_) or hyphen (-) characters */
  id: string;
  format: 'dc+sd-jwt';
  meta?: {
    /** An array of strings that specifies allowed values for the type of the requested Verifiable Credential. */
    vct_values?: string[];
  };
  claims: OID4VPClaimQuery[];
  client_metadata: {
    vp_formats: {
      'dc+sd-jwt': {
        // TODO: Just picking "ES256" for now.
        // See https://www.rfc-editor.org/rfc/rfc7518.html#section-3.1 for possible values
        'sd-jwt_alg_values'?: ['ES256'];
        'kb-jwt_alg_values'?: ['ES256'];
      };
    };
  };
};

/**
 * 6.3. Claims Query
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#section-6.3
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
 * B.3.1.2. Parameters in the Claims Query (mdoc)
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#appendix-B.3.1.2
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
export type OID4VPSupportedMdocClaimName = Exclude<Identifier, 'age_over_NN'> | 'age_over_21';
