import { type COSEALG, COSECRV, COSEKEYS, type COSEPublicKeyEC2 } from '../cose.ts';
import { mapCoseAlgToWebCryptoAlg } from './mapCoseAlgToWebCryptoAlg.ts';
import { base64url, importPublicKeyJWK } from './index.ts';
import type { SubtleCryptoAlg, SubtleCryptoCrv, Uint8Array_ } from './types.ts';

/**
 * Verify a signature using an EC2 public key
 */
export async function verifyEC2(opts: {
  cosePublicKey: COSEPublicKeyEC2;
  signature: Uint8Array_;
  data: Uint8Array_;
  shaHashOverride?: COSEALG;
}): Promise<boolean> {
  const { cosePublicKey, signature, data, shaHashOverride } = opts;

  // Import the public key
  const alg = cosePublicKey.get(COSEKEYS.alg);
  const crv = cosePublicKey.get(COSEKEYS.crv);
  const x = cosePublicKey.get(COSEKEYS.x);
  const y = cosePublicKey.get(COSEKEYS.y);

  if (!alg) {
    throw new Error('Public key was missing alg (EC2)');
  }

  if (!crv) {
    throw new Error('Public key was missing crv (EC2)');
  }

  if (!x) {
    throw new Error('Public key was missing x (EC2)');
  }

  if (!y) {
    throw new Error('Public key was missing y (EC2)');
  }

  let _crv: SubtleCryptoCrv;
  if (crv === COSECRV.P256) {
    _crv = 'P-256';
  } else if (crv === COSECRV.P384) {
    _crv = 'P-384';
  } else if (crv === COSECRV.P521) {
    _crv = 'P-521';
  } else {
    throw new Error(`Unexpected COSE crv value of ${crv} (EC2)`);
  }

  const keyData: JsonWebKey = {
    kty: 'EC',
    crv: _crv,
    x: base64url.bufferToBase64URL(x),
    y: base64url.bufferToBase64URL(y),
    ext: false,
  };

  const keyAlgorithm: EcKeyImportParams = {
    /**
     * Note to future self: you can't use `mapCoseAlgToWebCryptoKeyAlgName()` here because some
     * leaf certs from actual devices specified an RSA SHA value for `alg` (e.g. `-257`) which
     * would then map here to `'RSASSA-PKCS1-v1_5'`. We always want `'ECDSA'` here so we'll
     * hard-code this.
     */
    name: 'ECDSA',
    namedCurve: _crv,
  };

  const key = await importPublicKeyJWK({
    keyData,
    algorithm: keyAlgorithm,
  });

  // Determine which SHA algorithm to use for signature verification
  let subtleAlg: SubtleCryptoAlg;
  if (shaHashOverride) {
    subtleAlg = mapCoseAlgToWebCryptoAlg(shaHashOverride);
  } else {
    subtleAlg = mapCoseAlgToWebCryptoAlg(alg);
  }

  const verifyAlgorithm: EcdsaParams = {
    name: 'ECDSA',
    hash: { name: subtleAlg },
  };

  return globalThis.crypto.subtle.verify(verifyAlgorithm, key, signature, data);
}
