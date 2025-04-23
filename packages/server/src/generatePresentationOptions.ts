import type { CredentialRequestOptions, DigitalCredentialRequest } from './dcapi.ts';
import { SimpleDigiCredsError } from './helpers/index.ts';
import {
  generateOID4VPRequest,
  type OID4VPMDLRequestOptions,
  type OID4VPSDJWTRequestOptions,
} from './protocols/oid4vp/generateOID4VPRequest.ts';

/**
 * Generate credential presentation request options suitable for passing into
 * `navigator.credentials.get()` as per the Digital Credentials API.
 *
 * Supported Protocols:
 * - OID4VP
 *
 * Supported Document Formats:
 * - mdoc
 */
export function generatePresentationOptions(
  options: OID4VPMDLRequestOptions | OID4VPSDJWTRequestOptions,
): CredentialRequestOptions {
  let request: DigitalCredentialRequest;

  /**
   * I'd love to be able to include multiple requests in different protocols, but alas, the
   * DC API does not yet support this.
   */
  if (options.protocol === 'oid4vp') {
    request = generateOID4VPRequest(options);
  } else {
    throw new SimpleDigiCredsError({
      message: `Unsupported presentation protocol "${options.protocol}"`,
      code: 'InvalidPresentationOptions',
    });
  }

  return {
    digital: {
      requests: [request],
    },
  };
}
