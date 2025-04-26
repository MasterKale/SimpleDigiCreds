import type { CredentialRequestOptions, DigitalCredentialRequest } from './dcapi.ts';
import { SimpleDigiCredsError } from './helpers/index.ts';
import {
  generateOID4VPRequest,
  type OID4VPMDLCredentialOptions,
  type OID4VPSDJWTCredentialOptions,
} from './protocols/oid4vp/generateOID4VPRequest.ts';

/**
 * Generate credential presentation request options suitable for passing into
 * `navigator.credentials.get()` as per the Digital Credentials API.
 *
 * Supported Protocols:
 * - OID4VP
 *
 * Supported Document Formats:
 * - ISO 18013-5 mdoc (mDL)
 * - SD-JWT-VC
 */
export async function generatePresentationRequest({
  credentialOptions,
  protocol = 'openid4vp',
  encryptResponse = false,
}: PresentationRequestOptions): Promise<GeneratedPresentationRequest> {
  let request: DigitalCredentialRequest;
  let privateKeyJWK: JsonWebKey | undefined = undefined;

  /**
   * I'd love to be able to include multiple requests in different protocols, but alas, the
   * DC API does not yet support this.
   */
  if (protocol === 'openid4vp') {
    ({ request, privateKeyJWK } = await generateOID4VPRequest(credentialOptions, encryptResponse));
  } else {
    throw new SimpleDigiCredsError({
      message: `Unsupported presentation protocol "${protocol}"`,
      code: 'InvalidPresentationOptions',
    });
  }

  return {
    dcapiOptions: {
      digital: {
        requests: [request],
      },
    },
    requestMetadata: { privateKeyJWK },
  };
}

export type PresentationRequestOptions = {
  credentialOptions: OID4VPMDLCredentialOptions | OID4VPSDJWTCredentialOptions;
  protocol?: 'openid4vp';
  encryptResponse?: boolean;
};

export type GeneratedPresentationRequest = {
  dcapiOptions: CredentialRequestOptions;
  requestMetadata: {
    privateKeyJWK?: JsonWebKey;
  };
};
