/**
 * Take a JSON Web Key and massage it into a WebCrypto public key
 */
export function importKey(opts: {
  keyData: JsonWebKey;
  algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams;
}): Promise<CryptoKey> {
  const { keyData, algorithm } = opts;

  return globalThis.crypto.subtle.importKey('jwk', keyData, algorithm, false, [
    'verify',
  ]);
}
