import { type CBORTag, decodeCBOR, encodeCBOR } from '@levischuck/tiny-cbor';

import type { DecodedDocument, DecodedIssuerSignedItem, MobileSecurityObject } from './types.ts';
import { SimpleDigiCredsError } from '../../helpers/simpleDigiCredsError.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';

export async function verifyNameSpaces(
  document: DecodedDocument,
): Promise<VerifiedNamespace> {
  const issuerSigned = document.get('issuerSigned');
  const issuerAuth = issuerSigned.get('issuerAuth');

  const decodedMSOBytes = decodeCBOR(issuerAuth[2]) as CBORTag;
  const decodedMSO = decodeCBOR(decodedMSOBytes.value as Uint8Array_) as MobileSecurityObject;

  const msoDigestAlg = decodedMSO.get('digestAlgorithm');

  const issuerSignedNameSpaces = issuerSigned.get('nameSpaces');
  const valueDigests = decodedMSO.get('valueDigests');

  // Values that we've verified the integrity of
  const verifiedDataElements: VerifiedNamespace = {};

  // Explore each document's signed items
  for (const [dataElemID, dataElemValues] of issuerSignedNameSpaces.entries()) {
    for (const issuerSignedItemBytes of dataElemValues) {
      const decodedItem = decodeCBOR(
        issuerSignedItemBytes.value as Uint8Array_,
      ) as DecodedIssuerSignedItem;

      const digestID = decodedItem.get('digestID');

      const matchingDigests = valueDigests.get(dataElemID);

      if (!matchingDigests) {
        throw new SimpleDigiCredsError({
          message: `could not find digests in MSO for data element "${dataElemID}"`,
          code: 'MdocVerificationError',
        });
      }

      const itemDigest = matchingDigests.get(digestID);

      if (!itemDigest) {
        throw new SimpleDigiCredsError({
          message: `could not find digest for digest id ${digestID}`,
          code: 'MdocVerificationError',
        });
      }

      const handoverInfoHashBuffer = await crypto.subtle.digest(
        msoDigestAlg,
        encodeCBOR(issuerSignedItemBytes),
      );
      const handoverInfoHashBytes = new Uint8Array(handoverInfoHashBuffer);

      const verified = handoverInfoHashBytes.length === itemDigest.length &&
        handoverInfoHashBytes.every((val, i) => val === itemDigest[i]);

      if (verified) {
        const elementIdentifier = decodedItem.get('elementIdentifier');
        const elementValue = decodedItem.get('elementValue');

        if (!verifiedDataElements[dataElemID]) {
          verifiedDataElements[dataElemID] = [];
        }

        verifiedDataElements[dataElemID].push([elementIdentifier, elementValue]);
      }
    }
  }

  return verifiedDataElements;
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
