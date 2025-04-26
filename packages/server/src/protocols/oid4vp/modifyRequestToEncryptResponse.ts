import type { DigitalCredentialRequest } from '../../dcapi/types.ts';
import { generateEncryptionKeypair } from '../../helpers/generateEncryptionKeypair.ts';

/**
 * Modify the request to ensure that the response is encrypted.
 */
export async function modifyRequestToEncryptResponse(
  request: DigitalCredentialRequest,
): Promise<{
  request: DigitalCredentialRequest;
  privateKeyJWK: JsonWebKey;
}> {
  const clientMetadata = request.data.client_metadata || {};

  /**
   * Change response_mode to "dc_api.jwt"
   */
  request.data.response_mode = 'dc_api.jwt';

  /**
   * Add `client_metadata.jwks`
   */
  const { privateKeyJWK, publicKeyJWK } = await generateEncryptionKeypair();
  clientMetadata.jwks = {
    keys: [publicKeyJWK],
  };

  /**
   * Add `authorization_encrypted_response_alg` and `authorization_encrypted_response_enc`
   */
  clientMetadata.authorization_encrypted_response_alg = 'ECDH-ES';
  clientMetadata.authorization_encrypted_response_enc = 'A128GCM';

  /**
   * Commit the changes to client_metadata
   */
  request.data.client_metadata = clientMetadata;

  return { request, privateKeyJWK };
}
