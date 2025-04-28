import { base64url, SimpleDigiCredsError } from './index.ts';
import { importAESGCMKey } from './importAESGCMKey.ts';
import { encryptAESGCM } from './encryptAESGCM.ts';
import { decryptAESGCM } from './decryptAESGCM.ts';
import type { Uint8Array_ } from './types.ts';

/**
 * Generate a seemingly random value suitable for use as a nonce to prevent replay attacks. In
 * actuality the nonce contains some information about the request, such as the expiration time and
 * the private key JWK used to decrypt the response.
 *
 * Nonce will be a string in the following format:
 *
 * `<base64url-encoded encrypted data>.<base64url-encoded encryption IV>`
 */
export async function generateNonce({
  serverAESKeySecret,
  presentationLifetime,
  privateKeyJWK,
}: {
  serverAESKeySecret: Uint8Array_;
  presentationLifetime: number;
  privateKeyJWK?: JsonWebKey;
}): Promise<string> {
  const data: NonceData = {
    expiresOn: new Date(Date.now() + presentationLifetime * 1000),
    privateKeyJWK,
  };

  const encryptionKey = await importAESGCMKey(serverAESKeySecret);
  const payload = new TextEncoder().encode(JSON.stringify(data));
  const [encryptedData, iv] = await encryptAESGCM(
    new Uint8Array(payload),
    encryptionKey,
  );

  const encryptedDataBase64URL = base64url.bufferToBase64URL(encryptedData);
  const ivBase64URL = base64url.bufferToBase64URL(iv);
  return _generateNonceInternals.stubThis(`${encryptedDataBase64URL}.${ivBase64URL}`);
}

/**
 * Make it possible to stub the return value during testing
 * @ignore Don't include this in docs output
 */
export const _generateNonceInternals = {
  stubThis: (value: string) => value,
};

/**
 * Extract the encrypted data out of the encrypted. The nonce must be a string with the following
 * format:
 *
 * `<base64url-encoded encrypted data>.<base64url-encoded encryption IV>`
 */
export async function decryptNonce({
  serverAESKeySecret,
  nonce,
}: {
  serverAESKeySecret: Uint8Array_;
  nonce: string;
}): Promise<NonceData> {
  const nonceParts = nonce.split('.');

  if (nonceParts.length !== 2) {
    throw new SimpleDigiCredsError({
      message: 'Nonce was not in the expected format',
      code: 'InvalidDCAPIResponse',
    });
  }

  const [encryptedDataBase64URL, ivBase64URL] = nonceParts;

  // Massage the base64url strings into Uint8Arrays
  const encryptedDataBytes = base64url.base64URLToBuffer(encryptedDataBase64URL);
  const ivBytes = base64url.base64URLToBuffer(ivBase64URL);

  // Decrypt the data
  const encryptionKey = await importAESGCMKey(serverAESKeySecret);
  const decrypted = await decryptAESGCM(encryptedDataBytes, ivBytes, encryptionKey);

  // Get the decrypted data into a JSON object
  const decryptedString = new TextDecoder().decode(decrypted);
  const decryptedJSON = JSON.parse(decryptedString);

  if (typeof decryptedJSON !== 'object' || decryptedJSON === null) {
    throw new SimpleDigiCredsError({
      message: `Nonce data ${decryptedJSON} was not a JSON object`,
      code: 'InvalidDCAPIResponse',
    });
  }

  if (typeof decryptedJSON.expiresOn !== 'string') {
    throw new SimpleDigiCredsError({
      message: `Nonce data ${decryptedJSON} did not contain an expiration time`,
      code: 'InvalidDCAPIResponse',
    });
  }

  decryptedJSON.expiresOn = new Date(decryptedJSON.expiresOn);

  return decryptedJSON as NonceData;
}

type NonceData = {
  expiresOn: Date;
  privateKeyJWK?: JsonWebKey;
};
