import type { DigitalCredentialRequest } from '../../dcapi/types.ts';
import { generateEncryptionKeypair } from '../../helpers/generateEncryptionKeypair.ts';
import { generateNonce } from '../../helpers/nonce.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';

/**
 * Modify the DC API request to ensure that the response is encrypted.
 */
export async function modifyRequestToEncryptResponse({
  request,
  serverAESKeySecret,
  presentationLifetime,
}: {
  request: DigitalCredentialRequest;
  serverAESKeySecret: Uint8Array_;
  presentationLifetime: number;
}): Promise<DigitalCredentialRequest> {
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
  request.data.nonce = await generateNonce({
    serverAESKeySecret,
    presentationLifetime,
    privateKeyJWK,
  });

  /**
   * Add `authorization_encrypted_response_alg` and `authorization_encrypted_response_enc` as per
   * OID4VC HAIP
   * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-6
   */
  clientMetadata.authorization_encrypted_response_alg = 'ECDH-ES';
  clientMetadata.authorization_encrypted_response_enc = 'A128GCM';

  /**
   * Commit the changes to client_metadata
   */
  request.data.client_metadata = clientMetadata;

  return request;
}
