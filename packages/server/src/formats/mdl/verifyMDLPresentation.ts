import { decodeCBOR } from '@levischuck/tiny-cbor';

import type { DCAPIRequestOID4VP } from '../../dcapi.ts';
import type { DecodedCredentialResponse } from './types.ts';
import { verifyIssuerSigned } from './verifyIssuerSigned.ts';
import { verifyDeviceSigned } from './verifyDeviceSigned.ts';
import { verifyNameSpaces } from './verifyNameSpaces.ts';
// import { convertX509BufferToPEM } from '../../helpers/x509/index.ts';
import { base64url, SimpleDigiCredsError } from '../../helpers/index.ts';
import type { VerifiedClaimsMap, VerifiedCredential } from '../../helpers/types.ts';
import { GeneratedPresentationRequestMetadata } from '../../generatePresentationRequest.ts';

/**
 * Verify an mdoc presentation as returned through the DC API
 */
export async function verifyMDLPresentation({
  presentation,
  request,
  requestMetadata,
}: {
  presentation: string;
  request: DCAPIRequestOID4VP;
  requestMetadata: GeneratedPresentationRequestMetadata;
}): Promise<VerifiedCredential> {
  if (!base64url.isBase64URLString(presentation)) {
    throw new SimpleDigiCredsError({
      message: 'mdoc presentation was not a base64url string',
      code: 'MdocVerificationError',
    });
  }

  const presentationBytes = base64url.base64URLToBuffer(presentation);

  const decodedResponse = decodeCBOR(presentationBytes) as DecodedCredentialResponse;
  const document = decodedResponse.get('documents')[0];

  // Verify the issuer-signed data
  const {
    verified: issuerSignedVerified,
    // x5chain: issuerX5C
  } = await verifyIssuerSigned(document);
  if (!issuerSignedVerified) {
    console.error('could not verify IssuerSigned (mdoc)');
    return {
      claims: {},
      issuerMeta: {},
    };
  }

  // Verify the device-signed data within the verified issuer-signed data
  const {
    verified: deviceSignedVerified,
    expiresOn,
    issuedAt,
    validFrom,
  } = await verifyDeviceSigned(document, request, requestMetadata);
  if (!deviceSignedVerified) {
    console.error('could not verify DeviceSigned (mdoc)');
    return {
      claims: {},
      issuerMeta: {},
    };
  }

  // Verify the actual claim values
  const verifiedNameSpaces = await verifyNameSpaces(document);

  /**
   * TODO: It's probably not important to return this, and instead verify the certificate chain
   * as part of verification using trust anchors specified when calling the verification method.
   * If the chain can't be verified then reject the presentation.
   */
  // const x5cPEM = issuerX5C.map(convertX509BufferToPEM);

  // Extract the verified data
  const verifiedClaims = Object.values(verifiedNameSpaces);

  const claims: VerifiedClaimsMap = {};
  for (const [claimName, claimValue] of verifiedClaims[0]) {
    claims[claimName] = claimValue;
  }

  return {
    claims,
    issuerMeta: {
      issuedAt,
      expiresOn,
      validFrom,
    },
  };
}
