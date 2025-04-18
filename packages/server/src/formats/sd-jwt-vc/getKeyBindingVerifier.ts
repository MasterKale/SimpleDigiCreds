import type { JwtPayload, KbVerifier } from '@sd-jwt/types';

import { base64url, SimpleDigiCredsError } from '../../helpers/index.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';

/**
 * Generate a function that can be called to verify the signature over the Key Binding JWT.
 * Intended to be used with **@sd-jwt/sd-jwt-vc**'s `SDJwtVcInstance` when populating its
 * `kbVerifier` initialization argument.
 */
export async function getKeyBindingVerifier(
  jwtPayload: Record<string, unknown>,
): Promise<KbVerifier | undefined> {
  const cnf = jwtPayload.cnf;

  // `cnf` property doesn't exist
  if (typeof cnf !== 'object') {
    return undefined;
  }

  // `cnf.jwk` property doesn't exist
  if (!Object.keys(cnf as object).includes('jwk')) {
    return undefined;
  }

  // @ts-ignore: we just made sure this exists
  const jwk: JsonWebKey = cnf.jwk;

  /**
   * Assert the JWK is in the right shape
   */
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') {
    throw new SimpleDigiCredsError({
      message: `Payload cnf.jwk had unsupported kty "${jwk.kty}" and crv "${jwk.crv}"`,
      code: 'SDJWTVerificationError',
    });
  }

  if (typeof jwk.x !== 'string' || !base64url.isBase64URLString(jwk.x)) {
    throw new SimpleDigiCredsError({
      message: `Payload cnf.jwk.x was not a base64url-encoded string`,
      code: 'SDJWTVerificationError',
    });
  }

  if (typeof jwk.y !== 'string' || !base64url.isBase64URLString(jwk.y)) {
    throw new SimpleDigiCredsError({
      message: `Payload cnf.jwk.y was not a base64url-encoded string`,
      code: 'SDJWTVerificationError',
    });
  }

  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['verify'],
  );

  return (data: string, signatureBase64URL: string, _: JwtPayload): Promise<boolean> => {
    const signaturePayload = new TextEncoder().encode(data) as Uint8Array_;
    const signatureBytes = base64url.base64URLToBuffer(signatureBase64URL);

    return crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'sha-256' },
      },
      publicKey,
      signatureBytes,
      signaturePayload,
    );
  };
}
