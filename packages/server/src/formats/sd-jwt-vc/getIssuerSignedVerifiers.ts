import type { Verifier } from '@sd-jwt/types';

import { COSEALG, COSEKEYS, isCOSEPublicKeyEC2 } from '../../cose.ts';
import { base64url, SimpleDigiCredsError, verifyEC2, x509 } from '../../helpers/index.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';

/**
 * Generate a function that can be called to verify the signature over the Issuer-signed JWT.
 * Intended to be used with **@sd-jwt/sd-jwt-vc**'s `SDJwtVcInstance` when populating its `verifier`
 * initialization argument.
 */
export function getIssuerVerifier(jwtHeader: Record<string, unknown>): Verifier {
  const x5c = jwtHeader.x5c;

  if (!Array.isArray(x5c) || x5c.length < 1) {
    throw new SimpleDigiCredsError({
      message: 'JWT header was missing required x5c',
      code: 'SDJWTVerificationError',
    });
  }

  if (!base64url.isBase64String(x5c[0])) {
    throw new SimpleDigiCredsError({
      message: 'Header x5c leaf cert was not a base64-encoded string',
      code: 'SDJWTVerificationError',
    });
  }

  // Extract leaf cert from header
  const coseLeafCert = x509.convertX509PublicKeyToCOSE(
    base64url.base64ToBuffer(x5c[0]),
  );

  if (!isCOSEPublicKeyEC2(coseLeafCert)) {
    throw new SimpleDigiCredsError({
      message: `Unsupported public key type ${coseLeafCert.get(COSEKEYS.kty)}`,
      code: 'SDJWTVerificationError',
    });
  }

  return (data: string, signatureBase64URL: string): Promise<boolean> => {
    const signaturePayload = new TextEncoder().encode(data) as Uint8Array_;
    const signatureBytes = base64url.base64URLToBuffer(signatureBase64URL);

    let hashAlg: COSEALG | undefined = undefined;
    if (jwtHeader.alg === 'ES256') {
      hashAlg = COSEALG.ES256;
    }

    return verifyEC2({
      cosePublicKey: coseLeafCert,
      data: signaturePayload,
      signature: signatureBytes,
      shaHashOverride: hashAlg,
    });
  };
}
