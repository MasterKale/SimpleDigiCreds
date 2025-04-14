import type { DCAPIRequestOID4VP } from '../../dcapi.ts';
import { SimpleDigiCredsError } from '../../helpers/index.ts';

import { parseJWTString } from './parseJWTString.ts';
import { verifyJWTSignature } from './verifyJWTSignature.ts';
import type {
  IssuerSignedJWTHeader,
  IssuerSignedJWTPayload,
  SelectiveDisclosureAlgorithm,
} from './types.ts';
import { hashDisclosure } from './hashDisclosure.ts';
import { isDisclosureObjectProperty, parseDisclosure } from './parseDisclosure.ts';

export async function verifySDJWTPresentation(
  presentation: string,
  request: DCAPIRequestOID4VP,
): Promise<VerifiedSDJWTPresentation> {
  // Treat the last item of the SD-JWT-VC differently if it's a key-binding JWT
  const hasKBJWT = !presentation.endsWith('~');

  console.log({ hasKBJWT });

  const vcParts = presentation.split('~');

  /**
   * Bail out because no claims were disclosed:
   *
   * <Issuer-signed JWT>~
   */
  if (vcParts.length === 1) {
    return {
      verifiedClaims: [],
    };
  }

  if (hasKBJWT && vcParts.length === 2) {
    /**
     * Bail out because no claims were present between the issuer-signed JWT and key-binding JWT:
     *
     * <Issuer-signed JWT>~<KB-JWT>
     */
    return {
      verifiedClaims: [],
    };
  }

  /**
   * From this point on, it should be safe to assume we have the issuer-signed JWT, at least
   * one claim, and an optional key-binding JWT
   *
   * <Issuer-signed JWT>~<Disclosure 1>~<Disclosure N>~
   * <Issuer-signed JWT>~<Disclosure 1>~<Disclosure N>~<KB-JWT>
   */
  const issuerSignedJWTString = vcParts[0];
  let disclosureStrings: string[] = [];
  let kbJWTString: string = '';

  if (hasKBJWT) {
    /** <Issuer-signed JWT>~<Disclosure 1>~<Disclosure N>~<KB-JWT> */
    disclosureStrings = vcParts.slice(1, -1);
    [kbJWTString] = vcParts.slice(-1);

    // Safety check
    if (!kbJWTString) {
      throw new SimpleDigiCredsError({
        message: 'How was there no key-binding JWT after all the logic that ran before here?',
        code: 'SDJWTVerificationError',
      });
    }
  } else {
    /** <Issuer-signed JWT>~<Disclosure 1>~<Disclosure N>~ */
    disclosureStrings = vcParts.slice(1);
  }

  const [header, payload, _, rawParts] = parseJWTString<
    IssuerSignedJWTHeader,
    IssuerSignedJWTPayload
  >(issuerSignedJWTString);

  /**
   * Validate the signature over the Issuer-signed JWT
   */
  const verified = await verifyJWTSignature(header, rawParts);

  if (!verified) {
    throw new SimpleDigiCredsError({
      message: 'JWT signature could not be verified',
      code: 'SDJWTVerificationError',
    });
  }

  /**
   * TODO: Validate the Issuer and that the signing key belongs to this Issuer
   */

  /**
   * Check that the _sd_alg claim value is understood and the hash algorithm is deemed secure
   */
  let selectiveDisclosureAlg: SelectiveDisclosureAlgorithm = 'sha-256';
  if (payload._sd_alg) {
    // Only supporting sha-256 for now - it should be pretty easy to add sha-384 and sha-512 later
    const supportedSDAlgs: SelectiveDisclosureAlgorithm[] = ['sha-256'];

    // Make sure the specified _sd_alg is one we support
    if (supportedSDAlgs.indexOf(payload._sd_alg) < 0) {
      throw new SimpleDigiCredsError({
        message: `Unsuppored _sd_alg value of ${payload._sd_alg}`,
        code: 'SDJWTVerificationError',
      });
    }

    selectiveDisclosureAlg = payload._sd_alg;
  }

  /**
   * Process the Disclosures and embedded digests in the Issuer-signed JWT
   *
   * TODO: This assumes _sd is in the root of the payload, but there can be nested disclosures too.
   * Figure that out later.
   */
  const selectiveDisclosureHashes = payload._sd;
  if (!selectiveDisclosureHashes || !Array.isArray(selectiveDisclosureHashes)) {
    throw new SimpleDigiCredsError({
      message: 'JWT payload _sd was missing or not an array',
      code: 'SDJWTVerificationError',
    });
  }

  const selectiveDisclosureHashesMap = Object.fromEntries(
    selectiveDisclosureHashes.map((value) => [value, true]),
  );

  const verifiedClaims: VerifiedSDJWTPresentation['verifiedClaims'] = [];
  const unmatchedDisclosures: string[] = [];

  for (const disclosure of disclosureStrings) {
    const disclosureHash = await hashDisclosure(disclosure, selectiveDisclosureAlg);
    if (!selectiveDisclosureHashesMap[disclosureHash]) {
      unmatchedDisclosures.push(disclosure);
      continue;
    }

    const parsedDisclosure = parseDisclosure(disclosure);

    /**
     * Validating as per https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-7.1-4.3.2.3.2.2.1
     */
    if (!isDisclosureObjectProperty(parsedDisclosure)) {
      throw new SimpleDigiCredsError({
        message: `Disclosure ${
          JSON.stringify(parsedDisclosure)
        } did not have three elements as expected`,
        code: 'SDJWTVerificationError',
      });
    }

    const [_, claimName, claimValue] = parsedDisclosure;

    if (claimName === '_sd' || claimName === '...') {
      throw new SimpleDigiCredsError({
        message: `Disclosure claim name "${claimName}" was disallowed value "_sd" or "..."`,
        code: 'SDJWTVerificationError',
      });
    }

    // @ts-ignore: I don't want to muddy up the definition of the payload's type
    if (payload[claimName] !== undefined) {
      throw new SimpleDigiCredsError({
        message: `Disclosure claim name "${claimName}" was found at same level of payload as "_sd"`,
        code: 'SDJWTVerificationError',
      });
    }

    // @ts-ignore: SD-JWT spec wants this assignment (to catch duplicates it seems)
    payload[claimName] = claimValue;
    verifiedClaims.push([claimName, claimValue]);

    /**
     * "If any Disclosure was not referenced by digest value in the Issuer-signed JWT (directly
     * or recursively via other Disclosures), the SD-JWT MUST be rejected."
     *
     * https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-7.1-4.5
     */
    if (unmatchedDisclosures.length > 0) {
      throw new SimpleDigiCredsError({
        message: `The following disclosures did not have a matching digest: ${
          JSON.stringify(unmatchedDisclosures)
        }`,
        code: 'SDJWTVerificationError',
      });
    }

    /**
     * "Check that the SD-JWT is valid using claims such as nbf, iat, and exp in the processed
     * payload. If a required validity-controlling claim is missing (see Section 9.7), the SD-JWT
     * MUST be rejected."
     *
     * https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-7.1-4.6
     *
     * iss (Issuer)
     * aud (Audience), although issuers MAY allow individual entries in the array to be selectively disclosable
     * exp (Expiration Time)
     * nbf (Not Before)
     * cnf (Confirmation Key)
     */
    // TODO

    // TODO: Need to verify kbJWTString
  }

  console.log(payload);

  return { verifiedClaims };
}

export type VerifiedSDJWTPresentation = {
  verifiedClaims: [elemID: string, elemValue: unknown][];
};
