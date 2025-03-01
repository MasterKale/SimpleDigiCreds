import type { DCAPIRequestOptions } from './dcapi.ts';
import type { OID4VPCredentialQuery, OID4VPCredentialQueryMdoc } from './protocols/oid4vp.ts';
import { verifyMdocPresentation } from './formats/mdoc/index.ts';
import { base64url, isDCAPIResponse, SimpleDigiCredsError } from './helpers/index.ts';

/**
 * Verify and return a credential presentation out of a call to the Digital Credentials API
 */
export async function verifyResponse({ response, options }: {
  response: unknown;
  options: DCAPIRequestOptions;
}): Promise<VerifiedResponse> {
  const verifiedValues: VerifiedResponse = {};

  // console.log({ response, options });

  if (!isDCAPIResponse(response)) {
    throw new SimpleDigiCredsError({
      message: 'Response was not the expected shape',
      code: 'InvalidDCAPIResponse',
    });
  }

  // We've verified the shape of the response, now verify it
  for (const request of options.digital.requests) {
    const { dcql_query } = request;

    for (const requestedCred of dcql_query.credentials) {
      const { id } = requestedCred;

      const matchingResponse = response.vp_token[id];

      if (!matchingResponse) {
        console.warn(`could not find matching response for cred id "${id}", skipping`);
        continue;
      }

      if (isMdocRequest(requestedCred)) {
        // Begin verifying the mdoc
        const responseBytes = base64url.base64URLToBuffer(matchingResponse);
        const verifiedNamespace = await verifyMdocPresentation(responseBytes, request);

        // Extract the verified data
        const verifiedData = Object.values(verifiedNamespace);
        if (verifiedData.length < 1) {
          console.warn('document had no verified data, skipping');
          continue;
        }

        verifiedValues[id] = {};
        for (const [claimName, claimValue] of verifiedData[0]) {
          verifiedValues[id][claimName] = claimValue;
        }
      } else {
        throw new SimpleDigiCredsError({
          message: `Unsupported request structure for cred id "${requestedCred.id}")`,
          code: 'InvalidDCAPIResponse',
        });
      }
    }
  }

  return verifiedValues;
}

/**
 * Claims that could be successfully verified, mapped by requested credential ID
 *
 * Example:
 *
 * ```
 * {
 *   cred1: {
 *     given_name: 'Jon',
 *     family_name: 'Smith',
 *     age_over_21: true,
 *   }
 * }
 * ```
 */
export type VerifiedResponse = {
  [credID: string]: { [claimName: string]: unknown };
};

/**
 * Help clarify the format of the credential being requested
 */
function isMdocRequest(
  query: OID4VPCredentialQuery | OID4VPCredentialQueryMdoc,
): query is OID4VPCredentialQueryMdoc {
  return (query as OID4VPCredentialQueryMdoc).format === 'mso_mdoc';
}
