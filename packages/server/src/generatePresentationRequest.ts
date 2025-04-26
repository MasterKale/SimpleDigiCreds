import type { CredentialRequestOptions, DigitalCredentialRequest } from './dcapi/types.ts';
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
  requestOrigin,
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
    requestMetadata: {
      requestOrigin,
      privateKeyJWK,
      // TODO: SD-JWT-VC and mDL use this `web-origin:...` client ID as of Draft 24, but I can't
      // find where it's defined for use after Draft 24...I guess it's going away?
      clientID: `web-origin:${requestOrigin}`,
    },
  };
}

export type PresentationRequestOptions = {
  credentialOptions: OID4VPMDLCredentialOptions | OID4VPSDJWTCredentialOptions;
  requestOrigin: string;
  protocol?: 'openid4vp';
  encryptResponse?: boolean;
};

/**
 * The output from `generatePresentationRequest()`
 */
export type GeneratedPresentationRequest = {
  dcapiOptions: CredentialRequestOptions;
  requestMetadata: GeneratedPresentationRequestMetadata;
};

/**
 * Various values necessary to verify the presentation request's response
 */
export type GeneratedPresentationRequestMetadata = {
  requestOrigin: string;
  clientID: string;
  privateKeyJWK?: JsonWebKey;
};
