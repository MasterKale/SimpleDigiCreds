import type { Uint8Array_ } from './helpers/types.ts';
import type { CredentialRequestOptions, DigitalCredentialRequest } from './dcapi/types.ts';
import { SimpleDigiCredsError } from './helpers/index.ts';
import {
  generateOID4VPRequest,
  type OID4VPMDLCredentialOptions,
  type OID4VPMdocCredentialOptionsFull,
  type OID4VPMdocCredentialOptionsSimple,
  type OID4VPSDJWTVCCredentialOptions,
} from './protocols/oid4vp/generateOID4VPRequest.ts';

/**
 * Generate credential presentation request options suitable for passing into
 * `navigator.credentials.get()` as per the Digital Credentials API.
 *
 * Supported Protocols:
 * - OID4VP (`"oid4vp"`)
 *
 * Supported Document Formats:
 * - ISO 18013-5 mDL (`"mdl"`)
 * - IETF SD-JWT-VC (`"sd-jwt-vc"`)
 */
export async function generatePresentationRequest({
  credentialOptions,
  serverAESKeySecret,
  presentationLifetime = 300,
  protocol = 'oid4vp',
  encryptResponse = true,
}: PresentationRequestOptions): Promise<GeneratedPresentationRequest> {
  let request: DigitalCredentialRequest;

  /**
   * I'd love to be able to include multiple requests in different protocols, but alas, the
   * DC API does not yet support this.
   */
  if (protocol === 'oid4vp') {
    ({ request } = await generateOID4VPRequest({
      credentialOptions,
      serverAESKeySecret,
      presentationLifetime,
      encryptResponse,
    }));
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
  };
}

export type PresentationRequestOptions = {
  credentialOptions:
    | OID4VPMdocCredentialOptionsSimple
    | OID4VPMdocCredentialOptionsFull
    | OID4VPMDLCredentialOptions
    | OID4VPSDJWTVCCredentialOptions;
  /** AES-GCM key material needed to symmetrically encrypt and decrypt information in the nonce. Must be 32 bytes */
  serverAESKeySecret: Uint8Array_;
  /** For how long in **seconds** the presentation ceremony should be valid. Defaults to 300s */
  presentationLifetime?: number;
  /** Which protocol to use to request the credential. Defaults to `'oid4vp'` */
  protocol?: 'oid4vp';
  /** Protect the response from the wallet. Defaults to `true` */
  encryptResponse?: boolean;
};

/**
 * The output from `generatePresentationRequest()`
 */
export type GeneratedPresentationRequest = {
  dcapiOptions: CredentialRequestOptions;
};
