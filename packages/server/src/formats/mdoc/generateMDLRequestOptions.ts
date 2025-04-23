import type { OID4VPCredentialQueryMdoc } from '../../protocols/oid4vp/types.ts';

/**
 * Generate an mDL-specific set of request options for the Digital Credentials API
 *
 * References:
 * - https://openid.net/specs/openid-4-verifiable-presentations-1_0-24.html#name-mobile-documents-or-mdocs-i
 * - https://www.iso.org/standard/69084.html
 */
export function generateMDLRequestOptions({
  id,
  desiredClaims,
}: {
  id: string;
  desiredClaims: string[];
}): OID4VPCredentialQueryMdoc {
  return {
    id,
    format: 'mso_mdoc',
    meta: {
      doctype_value: 'org.iso.18013.5.1.mDL',
    },
    claims: desiredClaims.map((claimName) => ({
      path: ['org.iso.18013.5.1', claimName],
    })),
  };
}
