export type SDJWTHeader = {
  alg: string;
  typ: string;
  x5c?: string[];
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
  nbf?: number;
  exp?: number;
  vct?: string;
  // https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-4.1.2
  cnf?: {
    jwk: JsonWebKey;
  };
};

// One of https://www.iana.org/assignments/named-information/named-information.xhtml
type IANANamedInformationHashAlgorithm = 'sha-256';
export type SelectiveDisclosureAlgorithm = IANANamedInformationHashAlgorithm;
