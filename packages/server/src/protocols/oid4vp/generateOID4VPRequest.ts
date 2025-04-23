import type { DigitalCredentialRequest } from '../../dcapi.ts';
import { generateNonce } from '../../helpers/generateNonce.ts';
import { SimpleDigiCredsError } from '../../helpers/simpleDigiCredsError.ts';
import { generateMDLRequestOptions } from './generateMDLRequestOptions.ts';
import { generateSDJWTRequestOptions } from './generateSDJWTRequestOptions.ts';
import type {
  OID4VPCredentialQueryMdoc,
  OID4VPCredentialQuerySDJWT,
  OID4VPSupportedMdocClaimName,
} from './types.ts';

/**
 * Generate an OID4VP credential presentation request usable with the Digital Credentials API
 */
export function generateOID4VPRequest(
  credentialOptions: OID4VPMDLCredentialOptions | OID4VPSDJWTCredentialOptions,
  signRequest: boolean,
): DigitalCredentialRequest {
  const { format, desiredClaims, requestOrigin } = credentialOptions;

  let request: OID4VPCredentialQueryMdoc | OID4VPCredentialQuerySDJWT;

  if (format === 'mdl') {
    request = generateMDLRequestOptions({ id: 'cred1', desiredClaims });
  } else if (format === 'sd-jwt') {
    const { acceptedVCTValues } = credentialOptions;
    request = generateSDJWTRequestOptions({ id: 'cred1', desiredClaims, acceptedVCTValues });
  } else {
    throw new SimpleDigiCredsError({
      message: `Unsupported credential format: ${format}`,
      code: 'InvalidPresentationOptions',
    });
  }

  return {
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
  };
}

export type OID4VPMDLCredentialOptions = {
  format: 'mdl';
  desiredClaims: OID4VPSupportedMdocClaimName[];
  requestOrigin: string;
};

export type OID4VPSDJWTCredentialOptions = {
  format: 'sd-jwt';
  desiredClaims: string[];
  requestOrigin: string;
  acceptedVCTValues?: string[];
};
