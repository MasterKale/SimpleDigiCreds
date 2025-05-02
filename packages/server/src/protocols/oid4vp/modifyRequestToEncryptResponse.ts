import type { DigitalCredentialRequest } from '../../dcapi/types.ts';
import { generateEncryptionKeypair } from '../../helpers/generateEncryptionKeypair.ts';
import { SimpleDigiCredsError } from '../../helpers/index.ts';
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
  const clientMetadata = request.data.client_metadata;

  if (!clientMetadata) {
    throw new SimpleDigiCredsError({
      message: 'Required property client_metadata is missing',
      code: 'InvalidPresentationOptions',
    });
  }

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
   * TODO: Do whatever HAIP says to do when it updates for OID4VP Draft 28. Old link:
   * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-6
   */
  // clientMetadata.encrypted_response_enc_values_supported = undefined;

  /**
   * Commit the changes to client_metadata
   */
  request.data.client_metadata = clientMetadata;

  return request;
}
