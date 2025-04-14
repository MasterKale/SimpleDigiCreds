import type { DCAPIRequestOID4VP } from '../../dcapi.ts';
import { SimpleDigiCredsError } from '../../helpers/index.ts';

import { parseJWTString } from './parseJWTString.ts';

export async function verifySDJWTPresentation(
  presentation: string,
  request: DCAPIRequestOID4VP,
): Promise<VerifiedSDJWTPresentation> {
  // TODO: Verify overall shape of the string
  console.log(presentation);

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

  const [header, payload, signature, rawSegments] = parseJWTString(issuerSignedJWTString);

  console.log(header);
  console.log(payload);
  console.log(signature);

  return {
    verifiedClaims: [],
  };
}

export type VerifiedSDJWTPresentation = {
  verifiedClaims: [elemID: string, elemValue: unknown][];
};
