import { decodeCBOR } from '@levischuck/tiny-cbor';

import type { DecodedCredentialResponse } from './types.ts';
import { verifyIssuerSigned } from './verifyIssuerSigned.ts';

/**
 * Verify an mdoc presentation as returned through the DC API
 */
export async function verifyMdocPresentation(
  responseBytes: Uint8Array,
): Promise<VerifiedNamespace> {
  const decodedResponse = decodeCBOR(responseBytes) as DecodedCredentialResponse;
  const document = decodedResponse.get('documents')[0];

  // TODO: The rest of the owl
  const { verified: issuerSignedVerified } = await verifyIssuerSigned(document);
  if (!issuerSignedVerified) {
    console.error(`could not verify IssuerSigned" (mdoc)`);
    return {};
  }

  return {};
}

/**
 * A map of namespaces and their verified, issuer-signed element identifiers and values
 *
 * Example:
 *
 * ```
 * {
 *   "org.iso.18013.5.1": [
 *     [ "given_name", "Jon" ],
 *     [ "family_name", "Smith" ],
 *     [ "age_over_21", true ]
 *   ]
 * }
 * ```
 */
export type VerifiedNamespace = { [namespaceID: string]: [elemID: string, elemValue: unknown][] };
