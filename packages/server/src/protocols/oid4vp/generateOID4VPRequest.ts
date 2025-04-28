import type { DigitalCredentialRequest } from '../../dcapi/types.ts';
import { generateNonce } from '../../helpers/nonce.ts';
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
    | OID4VPMdocCredentialOptionsSimple
    | OID4VPMdocCredentialOptionsFull
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
      claimPaths: desiredClaims.map((claim) => ['org.iso.18013.5.1', claim]),
    }));
  } else if (format === 'mdoc') {
    const { desiredClaims } = credentialOptions;

    let claimPaths: string[][];

    if (Array.isArray(desiredClaims) && desiredClaims.length === 0) {
      throw new SimpleDigiCredsError({
        message: 'Empty `desiredClaims` is not allowed',
        code: 'InvalidPresentationOptions',
      });
    }

    if (typeof desiredClaims[0] === 'string') {
      const { claimPathPrefix } = credentialOptions as OID4VPMdocCredentialOptionsSimple;
      /**
       * Apply the prefix to every claim in the simple list of names to create full claim paths
       */
      claimPaths = (desiredClaims as string[]).map((claim) => [
        claimPathPrefix,
        claim,
      ]);
    } else {
      /**
       * Claim paths are already fully specified so use them as-is
       */
      claimPaths = desiredClaims as OID4VPMdocCredentialOptionsFull['desiredClaims'];
    }

    ({ credentialQuery } = generateMdocRequestOptions({
      id: 'cred1',
      doctype: credentialOptions.doctype,
      claimPaths,
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

/**
 * Streamlines credential options when requesting an ISO 18013-5 mDL over OID4VP
 */
export type OID4VPMDLCredentialOptions = {
  format: 'mdl';
  desiredClaims: OID4VPSupportedMDLClaimName[];
};

/**
 * A simplified way to request generic mdoc-based credentials. For example, `claimPathPrefix` will
 * be prepended to every entry in `claimPaths` when generating the request:
 *
 * ```
 * claimPathPrefix: 'org.iso.7367.1',
 * desiredClaims: ['vehicle_holder', 'registration_number'],
 * ```
 *
 * ...becomes the following claim paths:
 *
 * ```
 * desiredClaims: [
 *   ["org.iso.7367.1", "vehicle_holder"],
 *   ["org.iso.7367.1", "registration_number"],
 * ],
 * ```
 */
export type OID4VPMdocCredentialOptionsSimple = {
  format: 'mdoc';
  doctype: string;
  /** Ex: 'com.emvco.payment_card.1' */
  claimPathPrefix: string;
  /** Ex: ['card_issuer', 'card_network'] */
  desiredClaims: string[];
};

/**
 * A way of requesting generic mdoc-based credentials that requires the caller to fully specify
 * more of the credential structure. For example, `desiredClaims` is a list of desired claims with
 * paths fully specified:
 *
 * ```
 * desiredClaims: [
 *   ['com.emvco.payment_card.1', 'card_number'],
 *   ['com.emvco.payment_card.1', 'card_network'],
 * ]
 * ```
 */
export type OID4VPMdocCredentialOptionsFull = {
  format: 'mdoc';
  doctype: string;
  /** Ex: [['org.iso.7367.1', 'basic_vehicle_info'], ['org.iso.23220.1', 'issue_date']] */
  desiredClaims: string[][];
};

/**
 * Supports SD-JWT-VC-based credentials
 */
export type OID4VPSDJWTCredentialOptions = {
  format: 'sd-jwt-vc';
  desiredClaims: (string | string[])[];
  acceptedVCTValues?: string[];
};
