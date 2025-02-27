import { decodeCBOR } from '@levischuck/tiny-cbor';

import type { DCAPIRequestOID4VP } from '../../dcapi.ts';
import type { DecodedCredentialResponse } from './types.ts';
import { verifyIssuerSigned } from './verifyIssuerSigned.ts';
import { verifyDeviceSigned } from './verifyDeviceSigned.ts';

/**
 * Verify an mdoc presentation as returned through the DC API
 */
export async function verifyMdocPresentation(
  responseBytes: Uint8Array,
  request: DCAPIRequestOID4VP,
): Promise<VerifiedNamespace> {
  const decodedResponse = decodeCBOR(responseBytes) as DecodedCredentialResponse;
  const document = decodedResponse.get('documents')[0];

  // Verify the issuer-signed data
  const { verified: issuerSignedVerified } = await verifyIssuerSigned(document);
  if (!issuerSignedVerified) {
    console.error('could not verify IssuerSigned (mdoc)');
    return {};
  }

  // Verify the device-signed data within the verified issuer-signed data
  const { verified: deviceSignedVerified } = await verifyDeviceSigned(document, request);
  if (!deviceSignedVerified) {
    console.error('could not verify DeviceSigned (mdoc)');
    return {};
  }

  // TODO: The rest of the owl

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
