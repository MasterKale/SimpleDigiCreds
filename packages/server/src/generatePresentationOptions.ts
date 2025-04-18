import { generateNonce } from './helpers/index.ts';
import type {
  OID4VPCredentialQueryMdoc,
  OID4VPCredentialQuerySDJWT,
  OID4VPSupportedMdocClaimName,
} from './protocols/oid4vp.ts';
import type { CredentialRequestOptions } from './dcapi.ts';
import { SimpleDigiCredsError } from './helpers/index.ts';
import { generateMDLRequestOptions } from './formats/mdoc/generateMDLRequestOptions.ts';
import { generateSDJWTRequestOptions } from './formats/sd-jwt-vc/generateSDJWTRequestOptions.ts';

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
  options: MDLRequestOptions | SDJWTRequestOptions,
): CredentialRequestOptions {
  const { credentialFormat, desiredClaims, requestOrigin } = options;

  let request: OID4VPCredentialQueryMdoc | OID4VPCredentialQuerySDJWT;

  /**
   * I'd love to be able to include multiple requests in different doc formats, but alas, the
   * DC API does not yet support this.
   */
  if (credentialFormat === 'mdl') {
    request = generateMDLRequestOptions({ id: 'cred1', desiredClaims });
  } else if (credentialFormat === 'sd-jwt') {
    const { acceptedVCTValues } = options;
    request = generateSDJWTRequestOptions({ id: 'cred1', desiredClaims, acceptedVCTValues });
  } else {
    throw new SimpleDigiCredsError({
      message: `Unsupported credential format: ${credentialFormat}`,
      code: 'InvalidPresentationOptions',
    });
  }

  return {
    digital: {
      requests: [
        {
          // https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#name-protocol
          protocol: 'openid4vp',
          data: {
            response_type: 'vp_token',
            response_mode: 'dc_api',
            client_id: `web-origin:${requestOrigin}`,
            nonce: generateNonce(),
            // https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#dcql_query
            dcql_query: { credentials: [request] },
          },
        },
      ],
    },
  };
}

export type MDLRequestOptions = {
  credentialFormat: 'mdl';
  desiredClaims: OID4VPSupportedMdocClaimName[];
  requestOrigin: string;
};

export type SDJWTRequestOptions = {
  credentialFormat: 'sd-jwt';
  desiredClaims: string[];
  requestOrigin: string;
  acceptedVCTValues?: string[];
};
