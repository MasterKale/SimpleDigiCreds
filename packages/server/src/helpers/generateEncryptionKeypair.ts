import * as jose from 'jose';

import { base64url } from './index.ts';
import type { OID4VPResponseEncryptionJWK } from '../protocols/oid4vp/types.ts';

/**
 * Generate an encryption keypair for use with the OID4VC, using HAIP recommendations.
 */
export async function generateEncryptionKeypair(): Promise<{
  privateKeyJWK: JsonWebKey;
  publicKeyJWK: OID4VPResponseEncryptionJWK;
}> {
  /**
   * The JWE alg (algorithm) header parameter (see Section 4.1.1 of [RFC7516]) value `ECDH-ES`
   * (as defined in Section 4.6 of [RFC7518]), with key agreement utilizing keys on the `P-256`
   * curve (see Section 6.2.1.1 of [RFC7518]) MUST be supported.
   *
   * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-5
   */
  const { privateKey, publicKey } = await jose.generateKeyPair('ECDH-ES', {
    crv: 'P-256',
    extractable: true,
  });

  const privateKeyJWK = await jose.exportJWK(privateKey);
  const _publicKeyJWK = await jose.exportJWK(publicKey);

  const publicKeyJWK: OID4VPResponseEncryptionJWK = {
    ..._publicKeyJWK,
    /**
     * The `kid` MUST uniquely identify the key within the context of the request, and `alg` MUST
     * be present so the Wallet knows which JWE `alg` to use.
     *
     * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-8.3
     */
    kid: base64url.bufferToBase64URL(globalThis.crypto.getRandomValues(new Uint8Array(8))),
    alg: 'ECDH-ES',
    use: 'enc',
  };

  return _generateEncryptionKeypairInternals.stubThis({ privateKeyJWK, publicKeyJWK });
}

/**
 * Make it possible to stub the return value during testing
 * @ignore Don't include this in docs output
 */
export const _generateEncryptionKeypairInternals = {
  stubThis: (
    value: { privateKeyJWK: JsonWebKey; publicKeyJWK: OID4VPResponseEncryptionJWK },
  ) => value,
};
