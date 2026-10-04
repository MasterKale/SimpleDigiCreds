import { decodeCBOR } from '@levischuck/tiny-cbor';

import type { DecodedCredentialResponse } from './types.ts';
import { verifyIssuerSigned } from './verifyIssuerSigned.ts';
import { verifyDeviceSigned } from './verifyDeviceSigned.ts';
import { verifyNameSpaces } from './verifyNameSpaces.ts';
// import { convertX509BufferToPEM } from '../../helpers/x509/index.ts';
import { base64url, SimpleDigiCredsError } from '../../helpers/index.ts';
import type { VerifiedClaimsMap, VerifiedCredential } from '../../helpers/types.ts';

/**
 * Verify an mdoc presentation as returned through the DC API
 */
export async function verifyMDocPresentation({
  presentation,
  nonce,
  possibleOrigins,
  verifierPublicKeyJWK,
}: {
  presentation: string;
  nonce: string;
  possibleOrigins: string[];
  verifierPublicKeyJWK?: JsonWebKey;
}): Promise<VerifiedCredential> {
  if (!base64url.isBase64URLString(presentation)) {
    throw new SimpleDigiCredsError({
      message: 'mdoc presentation was not a base64url string',
      code: 'MdocVerificationError',
    });
  }

  const presentationBytes = base64url.base64URLToBuffer(presentation);

  let decodedResponse: DecodedCredentialResponse;
  try {
    decodedResponse = decodeCBOR(presentationBytes) as DecodedCredentialResponse;
  } catch (err) {
    throw new SimpleDigiCredsError({
      message: 'Could not decode mdoc presentation',
      code: 'MdocVerificationError',
      cause: err as Error,
    });
  }

  /**
   * A status of 0 means "OK". See ISO/IEC 18013-5 8.3.2.1.2.3
   */
  const status = decodedResponse.get('status');
  if (status !== 0) {
    throw new SimpleDigiCredsError({
      message: `mdoc presentation had non-OK status ${status}`,
      code: 'MdocVerificationError',
    });
  }

  /**
   * Each mdoc is returned in its own DeviceResponse
   *
   * https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html#section-5.3.1
   */
  const documents = decodedResponse.get('documents');
  if (!Array.isArray(documents) || documents.length !== 1) {
    throw new SimpleDigiCredsError({
      message: `mdoc presentation contained ${documents?.length ?? 0} documents, expected 1`,
      code: 'MdocVerificationError',
    });
  }
  const [document] = documents;

  // Verify the issuer-signed data
  const {
    verified: issuerSignedVerified,
    // x5chain: issuerX5C
  } = await verifyIssuerSigned(document);
  if (!issuerSignedVerified) {
    throw new SimpleDigiCredsError({
      message: 'Could not verify IssuerSigned',
      code: 'MdocVerificationError',
    });
  }

  // Verify the device-signed data within the verified issuer-signed data
  const {
    verified: deviceSignedVerified,
    verifiedOrigin,
    expiresOn,
    issuedAt,
    validFrom,
  } = await verifyDeviceSigned({ document, nonce, possibleOrigins, verifierPublicKeyJWK });
  if (!deviceSignedVerified) {
    throw new SimpleDigiCredsError({
      message: 'Could not verify DeviceSigned',
      code: 'MdocVerificationError',
    });
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

  // Iterate through all the namespaces in the document and extract the verified claims
  const claims: VerifiedClaimsMap = {};
  for (const claimSet of verifiedClaims) {
    for (const [claimName, claimValue] of claimSet) {
      claims[claimName] = claimValue;
    }
  }

  return {
    claims,
    issuerMeta: {
      issuedAt,
      expiresOn,
      validFrom,
    },
    presentationMeta: {
      verifiedOrigin,
    },
  };
}
