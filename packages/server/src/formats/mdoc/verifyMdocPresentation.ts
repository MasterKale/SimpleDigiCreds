import { decodeCBOR } from '@levischuck/tiny-cbor';

import type { DCAPIRequestOID4VP } from '../../dcapi.ts';
import type { DecodedCredentialResponse } from './types.ts';
import { verifyIssuerSigned } from './verifyIssuerSigned.ts';
import { verifyDeviceSigned } from './verifyDeviceSigned.ts';
import { type VerifiedNamespace, verifyNameSpaces } from './verifyNameSpaces.ts';
import { convertX509BufferToPEM } from '../../helpers/x509/index.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';

/**
 * Verify an mdoc presentation as returned through the DC API
 */
export async function verifyMdocPresentation(
  responseBytes: Uint8Array_,
  request: DCAPIRequestOID4VP,
): Promise<VerifiedMdocPresentation> {
  const decodedResponse = decodeCBOR(responseBytes) as DecodedCredentialResponse;
  const document = decodedResponse.get('documents')[0];

  // Verify the issuer-signed data
  const { verified: issuerSignedVerified, x5chain: issuerX5C } = await verifyIssuerSigned(document);
  if (!issuerSignedVerified) {
    console.error('could not verify IssuerSigned (mdoc)');
    return {
      verifiedClaims: {},
      issuerX5C: [],
    };
  }

  // Verify the device-signed data within the verified issuer-signed data
  const { verified: deviceSignedVerified } = await verifyDeviceSigned(document, request);
  if (!deviceSignedVerified) {
    console.error('could not verify DeviceSigned (mdoc)');
    return {
      verifiedClaims: {},
      issuerX5C: [],
    };
  }

  // Verify the actual claim values
  const verifiedClaims = await verifyNameSpaces(document, request);

  // TODO: In case it's a bad idea to flatten claims like we're doing above
  // verifiedValues[id] = verifiedItems;

  /**
   * TODO: It's probably not important to return this, and instead verify the certificate chain
   * as part of verification using trust anchors specified when calling `verifyResponse()`.
   * If the chain can't be verified then reject the presentation.
   */
  const x5cPEM = issuerX5C.map(convertX509BufferToPEM);

  return {
    verifiedClaims,
    issuerX5C: x5cPEM,
  };
}

type VerifiedMdocPresentation = {
  verifiedClaims: VerifiedNamespace;
  issuerX5C: string[];
};
