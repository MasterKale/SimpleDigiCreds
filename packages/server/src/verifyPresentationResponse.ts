import type { CredentialRequestOptions } from './dcapi.ts';
import type {
  OID4VPCredentialQuery,
  OID4VPCredentialQueryMdoc,
  OID4VPCredentialQuerySDJWT,
} from './protocols/oid4vp/types.ts';
import { verifyMDLPresentation } from './formats/mdl/index.ts';
import { verifySDJWTPresentation } from './formats/sd-jwt-vc/index.ts';
import { isDCAPIResponse, SimpleDigiCredsError } from './helpers/index.ts';
import type { VerifiedPresentation } from './helpers/types.ts';

/**
 * Verify and return a credential presentation out of a call to the Digital Credentials API
 */
export async function verifyPresentationResponse({ response, options }: {
  response: unknown;
  options: CredentialRequestOptions;
}): Promise<VerifiedPresentation> {
  const verifiedValues: VerifiedPresentation = {};

  if (!isDCAPIResponse(response)) {
    throw new SimpleDigiCredsError({
      message: 'Response was not the expected shape',
      code: 'InvalidDCAPIResponse',
    });
  }

  // We've verified the shape of the response, now verify it
  for (const request of options.digital.requests) {
    const { dcql_query } = request.data;

    for (const requestedCred of dcql_query.credentials) {
      const { id } = requestedCred;

      verifiedValues[id] = {
        claims: {},
        issuerMeta: {},
      };

      const matchingPresentation = response.vp_token[id];

      if (!matchingPresentation) {
        console.warn(`could not find matching response for cred id "${id}", skipping`);
        continue;
      }

      if (isMdocPresentation(requestedCred)) {
        const verifiedCredential = await verifyMDLPresentation(
          matchingPresentation,
          request.data,
        );

        verifiedValues[id] = verifiedCredential;
      } else if (isSDJWTPresentation(requestedCred)) {
        const verifiedCredential = await verifySDJWTPresentation({
          presentation: matchingPresentation,
          matchingCredentialQuery: requestedCred,
          request: request.data,
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
