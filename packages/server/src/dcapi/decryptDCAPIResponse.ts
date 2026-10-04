import * as jose from 'jose';

import { SimpleDigiCredsError } from '../helpers/index.ts';
import { SUPPORTED_RESPONSE_ENC_VALUES } from '../protocols/oid4vp/modifyRequestToEncryptResponse.ts';

/**
 * Decrypt the value of `data.response` in an encrypted DC API response.
 *
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-8.3
 */
export async function decryptDCAPIResponse(
  responseJWE: string,
  privateKeyJWK: JsonWebKey,
  publicKeyJWK?: JsonWebKey,
): Promise<object> {
  let decryptResult: jose.JWTDecryptResult;
  try {
    decryptResult = await jose.jwtDecrypt(
      responseJWE,
      privateKeyJWK,
      {
        keyManagementAlgorithms: ['ECDH-ES'],
        contentEncryptionAlgorithms: SUPPORTED_RESPONSE_ENC_VALUES,
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

  /**
   * The JWE MUST echo the `kid` of the key it was encrypted to. Wallets implementing drafts of
   * OID4VP prior to 1.0 may omit it, so only reject a `kid` that's present but doesn't match.
   */
  const expectedKID = (publicKeyJWK as { kid?: string } | undefined)?.kid;
  const { kid } = decryptResult.protectedHeader;
  if (expectedKID && kid !== undefined && kid !== expectedKID) {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: `Response JWE kid "${kid}" did not match expected kid "${expectedKID}"`,
    });
  }

  return decryptResult.payload;
}
