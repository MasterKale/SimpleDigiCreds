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
  options: OID4VPMDLRequestOptions | OID4VPSDJWTRequestOptions,
): DigitalCredentialRequest {
  const { credentialFormat, desiredClaims, requestOrigin } = options;

  let request: OID4VPCredentialQueryMdoc | OID4VPCredentialQuerySDJWT;

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

export type OID4VPMDLRequestOptions = {
  protocol: 'oid4vp';
  credentialFormat: 'mdl';
  desiredClaims: OID4VPSupportedMdocClaimName[];
  requestOrigin: string;
};

export type OID4VPSDJWTRequestOptions = {
  protocol: 'oid4vp';
  credentialFormat: 'sd-jwt';
  desiredClaims: string[];
  requestOrigin: string;
  acceptedVCTValues?: string[];
};
