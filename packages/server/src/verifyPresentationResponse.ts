import { verifyMDocPresentation } from './formats/mdoc/index.ts';
import { verifySDJWTPresentation } from './formats/sd-jwt-vc/index.ts';
import { parseDCAPIResponse, SimpleDigiCredsError } from './helpers/index.ts';
import type { Uint8Array_, VerifiedPresentation } from './helpers/types.ts';
import type { DCAPIWalletErrorOID4VP } from './dcapi/types.ts';
import { isEncryptedDCAPIResponse } from './dcapi/isEncryptedDCAPIResponse.ts';
import { decryptDCAPIResponse } from './dcapi/decryptDCAPIResponse.ts';
import { decryptNonce } from './helpers/nonce.ts';

/**
 * Verify and return a credential presentation out of a call to the Digital Credentials API
 *
 * @throws `SimpleDigiCredsError`
 */
export async function verifyPresentationResponse({
  data,
  nonce,
  expectedOrigin,
  serverAESKeySecret,
}: {
  data: object | string;
  nonce: string;
  expectedOrigin: string | string[];
  serverAESKeySecret: Uint8Array_;
}): Promise<VerifiedPresentation> {
  const verifiedValues: VerifiedPresentation = {};

  // If the data is a string then parse it as JSON as the DC API sometimes returns stringified JSON
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  if (typeof data !== 'object') {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: `data was type ${typeof data}, not an object`,
    });
  }

  // Wallets can return errors without encrypting them
  assertNotWalletError(data);

  // Extract values like expiration time and privateKeyJWK from the nonce
  const {
    expiresOn,
    responseEncryptionKeys,
    expectedCredentials,
  } = await decryptNonce({ nonce, serverAESKeySecret });
  const now = new Date();

  if (expiresOn < now) {
    throw new SimpleDigiCredsError({
      message: `Nonce expired at ${expiresOn.toISOString()}, current time is ${now.toISOString()}`,
      code: 'InvalidDCAPIResponse',
    });
  }

  /**
   * Presence of a private key JWK in the request metadata indicates that the response should be
   * encrypted.
   */
  if (responseEncryptionKeys?.privateKeyJWK) {
    if (!isEncryptedDCAPIResponse(data)) {
      throw new SimpleDigiCredsError({
        message: 'Response did not appear to be encrypted JWT',
        code: 'InvalidDCAPIResponse',
      });
    }

    data = await decryptDCAPIResponse(
      data.response,
      responseEncryptionKeys.privateKeyJWK,
      responseEncryptionKeys.publicKeyJWK,
    );

    // Wallets can also return errors within the encrypted response
    assertNotWalletError(data);
  }

  let possibleOrigins: string[] = [];
  if (Array.isArray(expectedOrigin)) {
    possibleOrigins = expectedOrigin;
  } else {
    possibleOrigins = [expectedOrigin];
  }

  const { vp_token } = parseDCAPIResponse(data);

  /**
   * Don't assume the Wallet will have returned what was requested. Look at each credential
   * ID in the list of presented credentials and make sure each is in the list of the credential
   * IDs we specified when requesting presentation.
   *
   * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-14.9
   */
  for (const credID of Object.keys(vp_token)) {
    if (!expectedCredentials.some((expected) => expected.id === credID)) {
      throw new SimpleDigiCredsError({
        message: `Response contained unrequested credential "${credID}"`,
        code: 'InvalidDCAPIResponse',
      });
    }
  }

  /**
   * Make sure the credentials we requested (by ID) are in the response
   */
  for (const expected of expectedCredentials) {
    if (!vp_token[expected.id]) {
      throw new SimpleDigiCredsError({
        message: `Response was missing requested credential "${expected.id}"`,
        code: 'InvalidDCAPIResponse',
      });
    }
  }

  // We've verified the shape of the response, now verify it
  for (const [credID, presentations] of Object.entries(vp_token)) {
    /**
     * This library never sets `multiple: true` in Credential Queries, so there MUST be only one
     * presentation per query
     *
     * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-8.1
     */
    if (presentations.length !== 1) {
      throw new SimpleDigiCredsError({
        message:
          `Expected exactly one presentation for "${credID}" but received ${presentations.length}`,
        code: 'InvalidDCAPIResponse',
      });
    }

    const [presentation] = presentations;
    const expected = expectedCredentials.find((expected) => expected.id === credID);
    const format = expected?.format;

    if (format === 'mso_mdoc') {
      const verifiedCredential = await verifyMDocPresentation({
        presentation,
        nonce,
        possibleOrigins,
        verifierPublicKeyJWK: responseEncryptionKeys?.publicKeyJWK,
      });

      verifiedValues[credID] = verifiedCredential;
    } else if (format === 'dc+sd-jwt') {
      const verifiedCredential = await verifySDJWTPresentation({
        presentation,
        nonce,
        possibleOrigins,
      });

      verifiedValues[credID] = verifiedCredential;
    } else {
      throw new SimpleDigiCredsError({
        message: `Could not determine type of presentation for "${credID}"`,
        code: 'InvalidDCAPIResponse',
      });
    }
  }

  return verifiedValues;
}

/**
 * Wallets return protocol errors as `{ "error": "..." }` within a fulfilled DC API response
 *
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#appendix-A.4
 */
function assertNotWalletError(data: object): void {
  const { error, error_description } = data as Partial<DCAPIWalletErrorOID4VP>;

  if (typeof error !== 'string') {
    return;
  }

  let message = `Wallet returned error "${error}"`;
  if (typeof error_description === 'string') {
    message += `: ${error_description}`;
  }

  throw new SimpleDigiCredsError({
    message,
    code: 'WalletErrorResponse',
    walletError: error,
  });
}
