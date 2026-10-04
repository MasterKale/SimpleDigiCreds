import { type SDJWTVCConfig, SDJwtVcInstance, type VerificationResult } from '@sd-jwt/sd-jwt-vc';
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
 *
 * References:
 * - https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-B.3
 * - https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-6.1
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

  /**
   * Require the JWT header's `typ` property to be set correctly
   *
   * https://datatracker.ietf.org/doc/html/draft-ietf-oauth-sd-jwt-vc-13#section-3.2.1
   */
  const issuerJWTHeader = decoded.jwt.header as SDJWTHeader;
  if (issuerJWTHeader.typ !== 'dc+sd-jwt') {
    throw new SimpleDigiCredsError({
      message: `SD-JWT-VC header had unexpected typ "${issuerJWTHeader.typ}"`,
      code: 'SDJWTVerificationError',
    });
  }

  const sdJWTVCInstanceConfig: SDJWTVCConfig = {
    verifier: getIssuerVerifier(issuerJWTHeader),
    hasher: hashSDJWTVCData,
  };

  /**
   * Every presentation must include a Key Binding JWT, otherwise a presentation could be replayed.
   * (This is related to `require_cryptographic_holder_binding` which defaults to `true` for now)
   *
   * - https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6.1
   * - https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-6.1.1.1
   */
  sdJWTVCInstanceConfig.kbVerifier = await getKeyBindingVerifier(decoded.jwt.payload);
  if (!sdJWTVCInstanceConfig.kbVerifier) {
    throw new SimpleDigiCredsError({
      message: 'Issuer-signed JWT did not have enough information to verify Key Binding JWT',
      code: 'SDJWTVerificationError',
    });
  }

  if (!decoded.kbJwt) {
    throw new SimpleDigiCredsError({
      message: 'Presentation was missing required Key Binding JWT',
      code: 'SDJWTVerificationError',
    });
  }

  const sdjwtVerifier = new SDJwtVcInstance(sdJWTVCInstanceConfig);

  let verified: VerificationResult;
  try {
    /**
     * Specifying `keyBindingNonce` requires the presence of a Key Binding JWT, and verifies its
     * signature, `typ`, `nonce`, and `sd_hash`.
     */
    verified = await sdjwtVerifier.verify(presentation, {
      keyBindingNonce: nonce,
      expectedKeyBindingAudience: possibleOrigins.map((origin) => `origin:${origin}`),
      /**
       * TODO: Token Status List checking isn't supported yet. Without this the library would
       * fetch the status list itself and verify it with the credential's signing key.
       */
      disableStatusVerification: true,
    });
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


  // This _shouldn't_ happen but just in case because the typing says `kb` can be undefined
  if (!verified.kb) {
    throw new SimpleDigiCredsError({
      message:
        'Key Binding JWT was supposedly verified but was not returned for some reason... (oops)',
      code: 'SDJWTVerificationError',
    });
  }

  // Verify the claims in the Key Binding JWT
  const { verifiedOrigin } = assertKeyBindingJWTClaims({
    payload: verified.kb.payload,
    possibleOrigins,
    nonce,
  });

  /**
   * Everything's fine, collect the disclosures
   */
  const claims: VerifiedClaimsMap = {};
  decoded.disclosures.forEach((disclosure) => {
    // This might drop ArrayElement disclosures, depending on how @sd-jwt/sd-jwt-vc handles them
    // https://www.rfc-editor.org/rfc/rfc9901.html#section-4.2.2
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
    presentationMeta: {
      verifiedOrigin,
      vct: issuerClaims.vct,
    },
  };
}
