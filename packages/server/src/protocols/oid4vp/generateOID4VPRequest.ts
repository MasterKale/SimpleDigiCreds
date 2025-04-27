import type { DigitalCredentialRequest } from '../../dcapi/types.ts';
import { generateNonce } from '../../helpers/generateNonce.ts';
import { SimpleDigiCredsError } from '../../helpers/simpleDigiCredsError.ts';
import { generateMdocRequestOptions } from './generateMdocRequestOptions.ts';
import { generateSDJWTRequestOptions } from './generateSDJWTRequestOptions.ts';
import { modifyRequestToEncryptResponse } from './modifyRequestToEncryptResponse.ts';
import type {
  OID4VPClientMetadataSDJWTVC,
  OID4VPCredentialQueryMDL,
  OID4VPCredentialQueryMdoc,
  OID4VPCredentialQuerySDJWTVC,
  OID4VPSupportedMDLClaimName,
} from './types.ts';

/**
 * Generate an OID4VP credential presentation request usable with the Digital Credentials API
 */
export async function generateOID4VPRequest(
  credentialOptions:
    | OID4VPMDLCredentialOptions
    | OID4VPMdocCredentialOptions
    | OID4VPSDJWTCredentialOptions,
  encryptResponse: boolean,
): Promise<{
  request: DigitalCredentialRequest;
  privateKeyJWK?: JsonWebKey;
}> {
  const { format, desiredClaims } = credentialOptions;

  let credentialQuery:
    | OID4VPCredentialQueryMdoc
    | OID4VPCredentialQueryMDL
    | OID4VPCredentialQuerySDJWTVC;
  let clientMetadata: OID4VPClientMetadataSDJWTVC | undefined = undefined;

  if (format === 'mdl') {
    ({ credentialQuery } = generateMdocRequestOptions({
      id: 'cred1',
      doctype: 'org.iso.18013.5.1.mDL',
      claimPathPrefix: 'org.iso.18013.5.1',
      desiredClaims,
    }));
  } else if (format === 'mdoc') {
    ({ credentialQuery } = generateMdocRequestOptions({
      id: 'cred1',
      doctype: credentialOptions.doctype,
      claimPathPrefix: credentialOptions.claimPathPrefix,
      desiredClaims,
    }));
  } else if (format === 'sd-jwt-vc') {
    const { acceptedVCTValues } = credentialOptions;
    ({ credentialQuery, clientMetadata } = generateSDJWTRequestOptions({
      id: 'cred1',
      desiredClaims,
      acceptedVCTValues,
    }));
  } else {
    throw new SimpleDigiCredsError({
      message: `Unsupported credential format: ${format}`,
      code: 'InvalidPresentationOptions',
    });
  }

  let request: DigitalCredentialRequest = {
    // https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#name-protocol
    protocol: 'openid4vp',
    data: {
      response_type: 'vp_token',
      response_mode: 'dc_api',
      // Omitting this for now, to come back later and set if/when we add request signing
      // client_id: `web-origin:${requestOrigin}`,
      nonce: generateNonce(),
      // https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#dcql_query
      dcql_query: { credentials: [credentialQuery] },
    },
  };

  if (clientMetadata) {
    request.data.client_metadata = clientMetadata;
  }

  let privateKeyJWK: JsonWebKey | undefined = undefined;
  if (encryptResponse) {
    ({ request: request, privateKeyJWK } = await modifyRequestToEncryptResponse(request));
  }

  return { request, privateKeyJWK };
}

export type OID4VPMDLCredentialOptions = {
  format: 'mdl';
  desiredClaims: OID4VPSupportedMDLClaimName[];
};

export type OID4VPMdocCredentialOptions = {
  format: 'mdoc';
  doctype: string;
  claimPathPrefix: string;
  desiredClaims: string[];
};

export type OID4VPSDJWTCredentialOptions = {
  format: 'sd-jwt-vc';
  desiredClaims: string[];
  acceptedVCTValues?: string[];
};
