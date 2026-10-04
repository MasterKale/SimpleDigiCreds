import { COSEALG } from '../../cose.ts';
import type { OID4VPClientMetadataMdoc, OID4VPCredentialQueryMdoc } from './types.ts';

/**
 * Generate an mdoc-specific set of request options for the Digital Credentials API.
 *
 * References:
 * - https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#name-mobile-documents-or-mdocs-i
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
  /**
   * HAIP requires support for "COSE algorithm identifier -7 or -9, as applicable"
   *
   * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-7
   */
  const supportedAlgs = [COSEALG.ES256, COSEALG.ESP256];

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
          issuerauth_alg_values: supportedAlgs,
          deviceauth_alg_values: supportedAlgs,
        },
      },
    },
  };
}
