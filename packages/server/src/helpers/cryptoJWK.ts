/**
 * Take a JSON Web Key and massage it into a WebCrypto public key
 */
export function importPublicKeyJWK(opts: {
  keyData: JsonWebKey;
  algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams;
  keyUsages?: KeyUsage[];
}): Promise<CryptoKey> {
  const { keyData, algorithm, keyUsages = ['verify'] } = opts;

  return globalThis.crypto.subtle.importKey('jwk', keyData, algorithm, false, keyUsages);
}
