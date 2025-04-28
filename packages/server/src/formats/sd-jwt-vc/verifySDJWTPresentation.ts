import { type SDJWTVCConfig, SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { type DecodedSDJwt, decodeSdJwt, getClaims } from '@sd-jwt/decode';

import type { IssuerSignedJWTPayload, SDJWTHeader } from '../../formats/sd-jwt-vc/types.ts';
import { SimpleDigiCredsError } from '../../helpers/index.ts';
import type { VerifiedClaimsMap, VerifiedCredential } from '../../helpers/types.ts';
import { hashSDJWTVCData } from './hashSDJWTVCData.ts';
import { getIssuerVerifier } from './getIssuerSignedVerifiers.ts';
import { getKeyBindingVerifier } from './getKeyBindingVerifier.ts';
import { assertIssuerSignedJWTClaims } from './assertIssuerSignedJWTClaims.ts';
import { assertKeyBindingJWTClaims } from './assertKeyBindingJWTClaims.ts';

/**
 * Verify an SD-JWT-VC presentation
 */
export async function verifySDJWTPresentation({
  presentation,
  nonce,
  possibleOrigins,
}: {
  presentation: string;
  nonce: string;
  possibleOrigins: string[];
}): Promise<VerifiedCredential> {
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
    verifier: getIssuerVerifier(decoded.jwt.header as SDJWTHeader),
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
    /**
     * If `verifyKeyBinding` is true then `sdjwtVerifier.verify()` will also take care of verifying
     * `sd_hash` in the Key Binding JWT
     *
     * https://github.com/openwallet-foundation/sd-jwt-js/blob/d2f2cb5a4d9f40e5d90209f572665a9bf1f0844b/packages/core/src/index.ts#L255-L257
     */
    verified = await sdjwtVerifier.verify(presentation, [], verifyKeyBinding);
  } catch (err) {
    const _err = err as Error;
    throw new SimpleDigiCredsError({
      message: 'Could not verify SD-JWT-VC',
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
  const issuerClaims = await getClaims<IssuerSignedJWTPayload>(
    decoded.jwt.payload,
    decoded.disclosures,
    hashSDJWTVCData,
  );

  assertIssuerSignedJWTClaims({ claims: issuerClaims });

  let verifiedOrigin = '';
  if (verifyKeyBinding) {
    // This _shouldn't_ happen but just in case because the typing says `kb` can be undefined
    if (!verified.kb) {
      throw new SimpleDigiCredsError({
        message:
          'Key Binding JWT was supposedly verified but was not returned for some reason... (oops)',
        code: 'SDJWTVerificationError',
      });
    }

    // Verify the claims in the Key Binding JWT
    ({ verifiedOrigin } = assertKeyBindingJWTClaims({
      payload: verified.kb.payload,
      possibleOrigins,
      nonce,
    }));
  }

  /**
   * Everything's fine, collect the disclosures
   */
  const claims: VerifiedClaimsMap = {};
  decoded.disclosures.forEach((disclosure) => {
    // This might drop ArrayElement disclosures, depending on how @sd-jwt/sd-jwt-vc handles them
    // https://www.ietf.org/archive/id/draft-ietf-oauth-selective-disclosure-jwt-17.html#section-4.2.2
    if (disclosure.key) {
      claims[disclosure.key] = disclosure.value;
    }
  });

  return {
    claims,
    issuerMeta: {
      expiresOn: issuerClaims.exp ? new Date(issuerClaims.exp * 1000) : undefined,
      issuedAt: issuerClaims.iat ? new Date(issuerClaims.iat * 1000) : undefined,
      validFrom: issuerClaims.nbf ? new Date(issuerClaims.nbf * 1000) : undefined,
    },
    credentialMeta: {
      verifiedOrigin,
      vct: issuerClaims.vct,
    },
  };
}
