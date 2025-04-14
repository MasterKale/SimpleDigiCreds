import { base64url, SimpleDigiCredsError, verifyEC2, x509 } from '../../helpers/index.ts';
import { COSEALG, COSEKEYS, isCOSEPublicKeyEC2 } from '../../cose.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';
import type { JWTHeader, JWTParts } from './types.ts';

export function verifyJWTSignature(
  parsedHeader: JWTHeader,
  parts: JWTParts,
): Promise<boolean> {
  if (!parsedHeader.x5c || parsedHeader.x5c.length < 1) {
    throw new SimpleDigiCredsError({
      message: 'JWT header was missing required x5c',
      code: 'SDJWTVerificationError',
    });
  }

  const coseLeafCert = x509.convertX509PublicKeyToCOSE(
    base64url.base64ToBuffer(parsedHeader.x5c[0]),
  );

  if (!isCOSEPublicKeyEC2(coseLeafCert)) {
    throw new SimpleDigiCredsError({
      message: `Unsupported public key type ${coseLeafCert.get(COSEKEYS.kty)}`,
      code: 'SDJWTVerificationError',
    });
  }

  const signaturePayload = new TextEncoder().encode(`${parts[0]}.${parts[1]}`) as Uint8Array_;
  const signatureBytes = base64url.base64URLToBuffer(parts[2]);

  let hashAlg: COSEALG | undefined = undefined;
  if (parsedHeader.alg === 'ES256') {
    hashAlg = COSEALG.ES256;
  }

  return verifyEC2({
    cosePublicKey: coseLeafCert,
    data: signaturePayload,
    signature: signatureBytes,
    shaHashOverride: hashAlg,
  });
}
