import * as jose from 'jose';

/**
 * Generate an encryption keypair for use with the OID4VC, using HAIP recommendations.
 */
export async function generateEncryptionKeypair(): Promise<{
  privateKeyJWK: JsonWebKey;
  publicKeyJWK: JsonWebKey;
}> {
  /**
   * The JWE alg (algorithm) header parameter (see Section 4.1.1 of [RFC7516]) value `ECDH-ES`
   * (as defined in Section 4.6 of [RFC7518]), with key agreement utilizing keys on the `P-256`
   * curve (see Section 6.2.1.1 of [RFC7518]) MUST be supported.
   *
   * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-6
   */
  const { privateKey, publicKey } = await jose.generateKeyPair('ECDH-ES', {
    crv: 'P-256',
    extractable: true,
  });

  const privateKeyJWK = await jose.exportJWK(privateKey);
  const publicKeyJWK = await jose.exportJWK(publicKey);

  publicKeyJWK.kid = 'ephemeral-enc-key';
  publicKeyJWK.use = 'enc';

  return _generateEncryptionKeypairInternals.stubThis({ privateKeyJWK, publicKeyJWK });
}

/**
 * Make it possible to stub the return value during testing
 * @ignore Don't include this in docs output
 */
export const _generateEncryptionKeypairInternals = {
  stubThis: (value: { privateKeyJWK: JsonWebKey; publicKeyJWK: JsonWebKey }) => value,
};
