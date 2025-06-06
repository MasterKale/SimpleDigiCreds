import type { DigitalCredentialRequest } from '../../dcapi/types.ts';
import { generateNonce } from '../../helpers/nonce.ts';
import { SimpleDigiCredsError } from '../../helpers/simpleDigiCredsError.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';
import { generateMdocRequestOptions } from './generateMdocRequestOptions.ts';
import { generateSDJWTRequestOptions } from './generateSDJWTRequestOptions.ts';
import { modifyRequestToEncryptResponse } from './modifyRequestToEncryptResponse.ts';
import type {
  OID4VPClientMetadataMdoc,
  OID4VPClientMetadataSDJWTVC,
  OID4VPCredentialQueryMDL,
  OID4VPCredentialQueryMdoc,
  OID4VPCredentialQuerySDJWTVC,
  OID4VPSupportedMDLClaimName,
} from './types.ts';

/**
 * Generate an OID4VP credential presentation request usable with the Digital Credentials API
 */
export async function generateOID4VPRequest({
  credentialOptions,
  serverAESKeySecret,
  encryptResponse,
  presentationLifetime,
}: {
  credentialOptions:
    | OID4VPMDLCredentialOptions
    | OID4VPMdocCredentialOptionsSimple
    | OID4VPMdocCredentialOptionsFull
    | OID4VPSDJWTVCCredentialOptions;
  serverAESKeySecret: Uint8Array_;
  presentationLifetime: number;
  encryptResponse: boolean;
}): Promise<{ request: DigitalCredentialRequest }> {
  const { format, desiredClaims } = credentialOptions;

  let credentialQuery:
    | OID4VPCredentialQueryMdoc
    | OID4VPCredentialQueryMDL
    | OID4VPCredentialQuerySDJWTVC;
  let clientMetadata: OID4VPClientMetadataSDJWTVC | OID4VPClientMetadataMdoc | undefined =
    undefined;

  const requestID = 'credential1';

  if (format === 'mdl') {
    ({ credentialQuery, clientMetadata } = generateMdocRequestOptions({
      id: requestID,
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

    ({ credentialQuery, clientMetadata } = generateMdocRequestOptions({
      id: requestID,
      doctype: credentialOptions.doctype,
      claimPaths,
    }));
  } else if (format === 'sd-jwt-vc') {
    const { acceptedVCTValues } = credentialOptions;
    ({ credentialQuery, clientMetadata } = generateSDJWTRequestOptions({
      id: requestID,
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
    protocol: 'openid4vp-v1-unsigned',
    data: {
      response_type: 'vp_token',
      response_mode: 'dc_api',
      nonce: await generateNonce({ serverAESKeySecret, presentationLifetime }),
      dcql_query: { credentials: [credentialQuery] },
    },
  };

  if (clientMetadata) {
    request.data.client_metadata = clientMetadata;
  }

  if (encryptResponse) {
    request = await modifyRequestToEncryptResponse({
      request,
      serverAESKeySecret,
      presentationLifetime,
    });
  }

  return { request };
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
export type OID4VPSDJWTVCCredentialOptions = {
  format: 'sd-jwt-vc';
  desiredClaims: (string | string[])[];
  acceptedVCTValues: string[];
};
