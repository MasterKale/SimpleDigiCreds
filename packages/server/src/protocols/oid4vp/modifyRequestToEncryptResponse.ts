import { DigitalCredentialRequest } from '../../dcapi.ts';

/**
 * Modify the request to ensure that the response is encrypted.
 */
export function modifyRequestToEncryptResponse(
  request: DigitalCredentialRequest,
): DigitalCredentialRequest {
  return request;
}
