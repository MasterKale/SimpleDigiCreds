import type { DigitalCredentialRequest } from '../../dcapi/types.ts';
import { SimpleDigiCredsError } from '../../helpers/index.ts';
import type { JWEENC_HAIP, OID4VPResponseEncryptionJWK } from './types.ts';

/**
 * JWE `enc` values this library can decrypt. HAIP requires Verifiers to list both:
 *
 * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-5
 */
export const SUPPORTED_RESPONSE_ENC_VALUES: JWEENC_HAIP[] = ['A128GCM', 'A256GCM'];

/**
 * Modify the DC API request to ensure that the response is encrypted.
 *
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-8.3
 */
export function modifyRequestToEncryptResponse({
  request,
  publicKeyJWK,
}: {
  request: DigitalCredentialRequest;
  publicKeyJWK: OID4VPResponseEncryptionJWK;
}): DigitalCredentialRequest {
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
   * Add `client_metadata.jwks` and the `enc` values we support
   */
  clientMetadata.jwks = { keys: [publicKeyJWK] };
  clientMetadata.encrypted_response_enc_values_supported = [...SUPPORTED_RESPONSE_ENC_VALUES];

  /**
   * Commit the changes to client_metadata
   */
  request.data.client_metadata = clientMetadata;

  return request;
}
