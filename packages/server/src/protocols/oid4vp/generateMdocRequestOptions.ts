import type { OID4VPCredentialQueryMdoc } from './types.ts';

/**
 * Generate an mdoc-specific set of request options for the Digital Credentials API.
 *
 * References:
 * - https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#name-mobile-documents-or-mdocs-i
 * - https://www.iso.org/standard/69084.html
 */
export function generateMdocRequestOptions({
  id,
  desiredClaims,
  doctype,
  claimPathPrefix,
}: {
  id: string;
  desiredClaims: string[];
  doctype: string;
  claimPathPrefix: string;
}): {
  credentialQuery: OID4VPCredentialQueryMdoc;
} {
  return {
    credentialQuery: {
      id,
      format: 'mso_mdoc',
      meta: {
        doctype_value: doctype,
      },
      claims: desiredClaims.map((claimName) => ({
        path: [claimPathPrefix, claimName],
      })),
    },
  };
}
