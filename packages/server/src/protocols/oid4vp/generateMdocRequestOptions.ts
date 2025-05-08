import type { OID4VPClientMetadataMdoc, OID4VPCredentialQueryMdoc } from './types.ts';

/**
 * Generate an mdoc-specific set of request options for the Digital Credentials API.
 *
 * References:
 * - https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#name-mobile-documents-or-mdocs-i
 * - https://www.iso.org/standard/69084.html
 */
export function generateMdocRequestOptions({
  id,
  doctype,
  claimPaths,
}: {
  id: string;
  doctype: string;
  claimPaths: string[][];
}): {
  credentialQuery: OID4VPCredentialQueryMdoc;
  clientMetadata: OID4VPClientMetadataMdoc;
} {
  return {
    credentialQuery: {
      id,
      format: 'mso_mdoc',
      meta: {
        doctype_value: doctype,
      },
      claims: claimPaths.map((path) => ({ path })),
    },
    clientMetadata: {
      vp_formats_supported: {
        mso_mdoc: {
          issuerauth_alg_values: [-7],
          deviceauth_alg_values: [-7],
        },
      },
    },
  };
}
