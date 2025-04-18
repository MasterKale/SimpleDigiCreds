import type { CredentialRequestOptions } from './dcapi.ts';
import type {
  OID4VPCredentialQuery,
  OID4VPCredentialQueryMdoc,
  OID4VPCredentialQuerySDJWT,
} from './protocols/oid4vp.ts';
import { verifyMdocPresentation } from './formats/mdoc/index.ts';
import { verifySDJWTPresentation } from './formats/sd-jwt-vc/index.ts';
import { isDCAPIResponse, SimpleDigiCredsError } from './helpers/index.ts';

/**
 * Verify and return a credential presentation out of a call to the Digital Credentials API
 */
export async function verifyPresentationResponse({ response, options }: {
  response: unknown;
  options: CredentialRequestOptions;
}): Promise<VerifiedPresentation> {
  const verifiedValues: VerifiedPresentation = {};

  // console.log({ response, options });

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
        verifiedClaims: {},
        meta: {
          // issuerAuth: verifiedPresentation.issuerX5C,
        },
      };

      const matchingPresentation = response.vp_token[id];

      if (!matchingPresentation) {
        console.warn(`could not find matching response for cred id "${id}", skipping`);
        continue;
      }

      if (isMdocPresentation(requestedCred)) {
        const verifiedPresentation = await verifyMdocPresentation(
          matchingPresentation,
          request.data,
        );

        // Extract the verified data
        const verifiedClaims = Object.values(verifiedPresentation.verifiedClaims);
        if (verifiedClaims.length < 1) {
          console.warn('document had no verifiable claims, skipping');
          continue;
        }

        verifiedValues[id] = {
          verifiedClaims: {},
          meta: {
            issuerAuth: verifiedPresentation.issuerX5C,
          },
        };

        for (const [claimName, claimValue] of verifiedClaims[0]) {
          verifiedValues[id].verifiedClaims[claimName] = claimValue;
        }
      } else if (isSDJWTPresentation(requestedCred)) {
        const { verifiedClaims } = await verifySDJWTPresentation({
          presentation: matchingPresentation,
          matchingCredentialQuery: requestedCred,
          dcapiRequestData: request.data,
        });

        if (verifiedClaims.length < 1) {
          console.warn('document had no verifiable claims, skipping');
          continue;
        }

        for (const [claimName, claimValue] of verifiedClaims) {
          verifiedValues[id].verifiedClaims[claimName] = claimValue;
        }
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
 * Claims that could be successfully verified, mapped by requested credential ID. Also includes
 * values that can be used to verify the issuer and wallet when available.
 *
 * Example:
 *
 * ```
 * {
 *   cred1: {
 *     verifiedClaims: {
 *       given_name: 'Jon',
 *       family_name: 'Smith',
 *       age_over_21: true,
 *     },
 *     meta: {
 *       issuerAuth: [...],
 *       walletAuth: [...],
 *     },
 *   }
 * }
 * ```
 */
export type VerifiedPresentation = {
  /**
   * TODO: Typing on this is kinda weird when working with output from this method. For example,
   * `verified.cred1.verifiedClaims` requires you to know that this library chose "cred1" as
   * the name when it generated credential request options. Can we collapse this type so that it's
   * `verified.verifiedClaims` instead?
   */
  [credID: string]: {
    verifiedClaims: VerifiedClaims;
    // TODO: What other data should come out of this? I heard it's okay to assume X.509 cert chains
    // in wallet responses.
    meta: {
      issuerAuth?: unknown;
      walletAuth?: unknown;
    };
  };
};

type VerifiedClaims = { [claimName: string]: unknown };

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
