import * as jose from 'jose';

import { SimpleDigiCredsError } from '../helpers/index.ts';

/**
 * Decrypt the value of `data.response` in an encrypted DC API response.
 */
export async function decryptDCAPIResponse(
  responseJWE: string,
  privateKeyJWK: JsonWebKey,
): Promise<object> {
  let decryptResult: jose.JWTDecryptResult;
  try {
    decryptResult = await jose.jwtDecrypt(
      responseJWE,
      privateKeyJWK,
      {
        keyManagementAlgorithms: ['ECDH-ES'],
        contentEncryptionAlgorithms: ['A128GCM'],
        clockTolerance: '1 second',
      },
    );
  } catch (err) {
    const _err = err as Error;

    throw new SimpleDigiCredsError({
      message: `Error decrypting response`,
      code: 'InvalidDCAPIResponse',
      cause: _err,
    });
  }

  if (decryptResult === null || typeof decryptResult !== 'object') {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: `Decrypted data was type ${typeof decryptResult}, not an object`,
    });
  }

  return decryptResult.payload;
}
