export type JWTParts = [
  headerBase64URL: string,
  payloadBase64URL: string,
  signatureBase64URL: string,
];

export type JWTHeader = {
  alg: string;
  typ: string;
  x5c?: string[];
};

export type IssuerSignedJWTHeader = JWTHeader & {
  alg: 'ES256';
  typ: 'dc+sd-jwt';
};

/**
 * https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-4.1
 */
export type IssuerSignedJWTPayload = {
  // https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-4.2.4.1
  _sd?: string[];
  _sd_alg?: SelectiveDisclosureAlgorithm;
  iss?: string;
  iat?: number;
  exp?: number;
  vct?: string;
  // https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-4.1.2
  cnf?: {
    jwk: JsonWebKey;
  };
};

/** https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#name-issuer-signed-jwt */
type IssuerSignedJWT = [
  IssuerSignedJWTHeader,
  IssuerSignedJWTPayload,
  IssuerSignedJWTSignature: string,
];

// One of https://www.iana.org/assignments/named-information/named-information.xhtml
type IANANamedInformationHashAlgorithm = 'sha-256' | 'sha-384' | 'sha-512';
export type SelectiveDisclosureAlgorithm = IANANamedInformationHashAlgorithm;

/**
 * 4.2.1. Disclosures for Object Properties
 * https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-4.2.1
 */
export type DisclosureObjectProperty = [
  salt: string,
  claimName: string,
  claimValue: unknown,
];

/**
 * 4.2.2. Disclosures for Array Elements
 * https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-4.2.2
 */
export type DisclosureArrayElement = [
  salt: string,
  arrayElement: unknown,
];
