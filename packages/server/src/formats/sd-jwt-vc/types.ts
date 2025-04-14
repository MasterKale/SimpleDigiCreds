type SDJWTHeader = {
  alg: 'ES256';
  typ: 'dc+sd-jwt';
  x5c?: string[];
};

/**
 * https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-4.1
 */
type SDJWTPayload = {
  // https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-4.2.4.1
  _sd: string[];
  _sd_alg?: SelectiveDisclosureAlgorithm;
};

/** https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#name-issuer-signed-jwt */
type IssuerSignedJWT = [
  SDJWTHeader,
  SDJWTPayload,
  // TODO: SDJWTSignature
];

// One of https://www.iana.org/assignments/named-information/named-information.xhtml
export type IANANamedInformationHashAlgorithm = 'sha-256' | 'sha-384' | 'sha-512';
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

/**
 * Help understand when a parsed disclosure is an Object Property
 */
export function isDisclosureObjectProperty(
  disclosure: DisclosureObjectProperty | DisclosureArrayElement,
): disclosure is DisclosureObjectProperty {
  return Array.isArray(disclosure) && disclosure.length === 3;
}

/**
 * Help understand when a parsed disclosure is an Array Element
 */
export function isDisclosureArrayElement(
  disclosure: DisclosureObjectProperty | DisclosureArrayElement,
): disclosure is DisclosureArrayElement {
  return Array.isArray(disclosure) && disclosure.length === 2;
}
