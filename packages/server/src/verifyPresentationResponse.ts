import type {
  OID4VPCredentialQuery,
  OID4VPCredentialQueryMdoc,
  OID4VPCredentialQuerySDJWT,
} from './protocols/oid4vp/types.ts';
import { verifyMDLPresentation } from './formats/mdl/index.ts';
import { verifySDJWTPresentation } from './formats/sd-jwt-vc/index.ts';
import { isDCAPIResponse, SimpleDigiCredsError } from './helpers/index.ts';
import type { VerifiedPresentation } from './helpers/types.ts';
import type { GeneratedPresentationRequest } from './generatePresentationRequest.ts';
import type { DCAPIEncryptedResponse, DCAPIResponse } from './dcapi/types.ts';
import { isEncryptedDCAPIResponse } from './dcapi/isEncryptedDCAPIResponse.ts';
import { decryptDCAPIResponse } from './dcapi/decryptDCAPIResponse.ts';

/**
 * Verify and return a credential presentation out of a call to the Digital Credentials API
 */
export async function verifyPresentationResponse({ data, request }: {
  data: DCAPIResponse | DCAPIEncryptedResponse;
  request: GeneratedPresentationRequest;
}): Promise<VerifiedPresentation> {
  const { dcapiOptions, requestMetadata } = request;
  const verifiedValues: VerifiedPresentation = {};

  if (data === null || typeof data !== 'object') {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: `data was type ${typeof data}, not an object`,
    });
  }

  /**
   * Presence of a private key JWK in the request metadata indicates that the response should be
   * encrypted.
   */
  if (request.requestMetadata.privateKeyJWK) {
    if (!isEncryptedDCAPIResponse(data)) {
      throw new SimpleDigiCredsError({
        message: 'Response did not appear to be encrypted JWT',
        code: 'InvalidDCAPIResponse',
      });
    }

    data = await decryptDCAPIResponse(
      data.response,
      request.requestMetadata.privateKeyJWK,
    ) as DCAPIResponse;
  }

  if (!isDCAPIResponse(data)) {
    throw new SimpleDigiCredsError({
      message: 'data was not the expected shape',
      code: 'InvalidDCAPIResponse',
    });
  }

  // We've verified the shape of the response, now verify it
  for (const request of dcapiOptions.digital.requests) {
    const { dcql_query } = request.data;

    for (const requestedCred of dcql_query.credentials) {
      const { id } = requestedCred;

      verifiedValues[id] = {
        claims: {},
        issuerMeta: {},
      };

      const matchingPresentation = data.vp_token[id];

      if (!matchingPresentation) {
        console.warn(`could not find matching response for cred id "${id}", skipping`);
        continue;
      }

      if (isMdocPresentation(requestedCred)) {
        const verifiedCredential = await verifyMDLPresentation({
          presentation: matchingPresentation,
          request: request.data,
          requestMetadata,
        });

        verifiedValues[id] = verifiedCredential;
      } else if (isSDJWTPresentation(requestedCred)) {
        const verifiedCredential = await verifySDJWTPresentation({
          presentation: matchingPresentation,
          matchingCredentialQuery: requestedCred,
          request: request.data,
          requestMetadata,
        });

        verifiedValues[id] = verifiedCredential;
      } else {
        throw new SimpleDigiCredsError({
          message:
            `Unsupported credential format "${requestedCred.format}" for cred id "${requestedCred.id}")`,
          code: 'InvalidDCAPIResponse',
        });
      }
    }
  }

  return verifiedValues;
}

/**
 * Type guard to make sure a query is for an mdoc
 */
function isMdocPresentation(
  query: OID4VPCredentialQuery | OID4VPCredentialQueryMdoc,
): query is OID4VPCredentialQueryMdoc {
  return (query as OID4VPCredentialQueryMdoc).format === 'mso_mdoc';
}

/**
 * Type guard to make sure a query is for an SD-JWT
 */
function isSDJWTPresentation(
  query: OID4VPCredentialQuery | OID4VPCredentialQuerySDJWT,
): query is OID4VPCredentialQuerySDJWT {
  return (query as OID4VPCredentialQuerySDJWT).format === 'dc+sd-jwt';
}
