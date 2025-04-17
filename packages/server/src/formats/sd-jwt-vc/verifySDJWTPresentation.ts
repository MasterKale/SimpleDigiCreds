import { type SDJWTVCConfig, SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { type DecodedSDJwt, decodeSdJwt, getClaims } from '@sd-jwt/decode';

import type { IssuerSignedJWTPayload, JWTHeader } from '../../formats/sd-jwt-vc/types.ts';
import { SimpleDigiCredsError } from '../../helpers/index.ts';
import { hashSDJWTVCData } from './hashSDJWTVCData.ts';
import { getIssuerVerifier } from './getIssuerSignedVerifiers.ts';
import { getKeyBindingVerifier } from './getKeyBindingVerifier.ts';
import { assertIssuerSignedClaims } from './assertIssuerSignedClaims.ts';
import type { OID4VPCredentialQuerySDJWT } from '../../protocols/oid4vp.ts';

/**
 * Verify an SD-JWT-VC presentation
 */
export async function verifySDJWTPresentation(
  presentation: string,
  credentialQuery: OID4VPCredentialQuerySDJWT,
): Promise<VerifiedSDJWTPresentation> {
  let decoded: DecodedSDJwt;
  try {
    decoded = await decodeSdJwt(presentation, hashSDJWTVCData);
  } catch (err) {
    const _err = err as Error;
    throw new SimpleDigiCredsError({
      message: 'Could not decode SD-JWT-VC',
      code: 'SDJWTVerificationError',
      cause: _err,
    });
  }

  const sdJWTVCInstanceConfig: SDJWTVCConfig = {
    verifier: getIssuerVerifier(decoded.jwt.header as JWTHeader),
    hasher: hashSDJWTVCData,
  };
  let verifyKeyBinding = false;

  if (decoded.kbJwt) {
    sdJWTVCInstanceConfig.kbVerifier = await getKeyBindingVerifier(decoded.jwt.payload);
    verifyKeyBinding = true;

    if (!sdJWTVCInstanceConfig.kbVerifier) {
      throw new SimpleDigiCredsError({
        message: 'Issuer-signed JWT did not have enough information to verify Key Binding JWT',
        code: 'SDJWTVerificationError',
      });
    }
  }

  const sdjwtVerifier = new SDJwtVcInstance(sdJWTVCInstanceConfig);

  // @sd-jwt/sd-jwt-vc doesn't export `VerificationResult` so we have to do some TS trickery here
  let verified: Awaited<ReturnType<SDJwtVcInstance['verify']>>;
  try {
    verified = await sdjwtVerifier.verify(presentation, [], verifyKeyBinding);
  } catch (err) {
    const _err = err as Error;
    throw new SimpleDigiCredsError({
      message: 'Could not verify SD-JWT-VC, see cause',
      code: 'SDJWTVerificationError',
      cause: _err,
    });
  }

  /**
   * TODO: Validate the Issuer and that the signing key belongs to this Issuer
   */

  /**
   * Make sure claims like exp, iat, and others are otherwise valid
   */
  const claims = await getClaims<IssuerSignedJWTPayload>(
    decoded.jwt.payload,
    decoded.disclosures,
    hashSDJWTVCData,
  );
  assertIssuerSignedClaims(claims, credentialQuery);

  if (verifyKeyBinding) {
    // This _shouldn't_ happen but just in case because the typing says `kb` can be undefined
    if (!verified.kb) {
      throw new SimpleDigiCredsError({
        message:
          'Key Binding JWT was supposedly verified but was not returned for some reason... (oops)',
        code: 'SDJWTVerificationError',
      });
    }

    /**
     * TODO: Verify `aud` is the client ID in the request options
     * TODO: Verify `nonce` is the nonce in the request options
     * TODO: Verify `sd_hash` is a hash over the SD-JWT and Claims (using _sd_alg/'sha-256')
     */
    console.log('TODO: verify key binding JWT\n', verified.kb.payload);
  }

  /**
   * Everything's fine, collect the disclosures
   */
  const verifiedClaims: VerifiedSDJWTPresentation['verifiedClaims'] = [];
  decoded.disclosures.forEach((disclosure) => {
    if (disclosure.key) {
      verifiedClaims.push([disclosure.key, disclosure.value]);
    }
  });

  /**
   * Return some more claims the Verifier might find useful
   */
  claims.iss && verifiedClaims.push(['issuer', claims.iss]);
  claims.iat && verifiedClaims.push(['issued_at', new Date(claims.iat * 1000)]);
  claims.exp && verifiedClaims.push(['expires_on', new Date(claims.exp * 1000)]);

  return { verifiedClaims };
}

export type VerifiedSDJWTPresentation = {
  verifiedClaims: [elemID: string, elemValue: unknown][];
};
