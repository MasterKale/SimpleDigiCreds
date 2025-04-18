import type { OID4VPCredentialQueryMdoc } from '../../protocols/oid4vp.ts';

/**
 * Generate an mDL-specific set of request options for the Digital Credentials API
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
