import { type CBORTag, type CBORType, decodeCBOR } from '@levischuck/tiny-cbor';

import { CBORX5Chain, COSEALG, COSEHEADER, COSEPublicKeyEC2, COSEPublicKeyOKP } from '../cose.ts';

/**
 * Verify an mdoc presentation as returned through the DC API
 */
export function verifyMdocPresentation(
  responseBytes: Uint8Array,
): VerifiedNamespace {
  const decodedResponse = decodeCBOR(responseBytes) as DecodedCredentialResponse;
  const document = decodedResponse.get('documents')[0];

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

const identifiers = [
  'family_name',
  'given_name',
  'birth_date',
  'issue_date',
  'expiry_date',
  'issuing_country',
  'issuing_authority',
  'document_number',
  'portrait',
  'un_distinguishing_sign',
  'age_in_years',
  'age_birth_year',
  'age_over_NN',
] as const;
export type Identifier = typeof identifiers[number];

/**
 * 7.1 mDL document type and namespace
 */
export type NamespaceMDLv1 = 'org.iso.18013.5.1';
export type DocumentTypeMDLv1 = `${NamespaceMDLv1}.mDL`;

/**
 * CBOR-related data structure definitions
 */
export type DecodedCredentialResponse = CBORType & {
  get(key: 'version'): string;
  get(key: 'status'): number;
  get(key: 'documents'): DecodedDocument[];
};

export type DecodedDocument = {
  get(key: 'docType'): string;
  get(key: 'issuerSigned'): DecodedIssuerSigned;
  get(key: 'deviceSigned'): DecodedDeviceSigned;
};

export type DecodedIssuerSigned = {
  get(key: 'nameSpaces'): DecodedIssuerSignedNameSpaces;
  get(key: 'issuerAuth'): IssuerAuth;
};

// Major Type 24 (Encoded CBOR data item)
/**
 * A map of namespace IDs (e.g. `""`) and CBOR-encoded claim names+values
 */
export type DecodedIssuerSignedNameSpaces = Map<string, CBORTag[]>;

export type DecodedIssuerSignedItem = {
  get(key: 'digestID'): number;
  get(key: 'random'): Uint8Array;
  get(key: 'elementIdentifier'): string;
  get(key: 'elementValue'): unknown; // Necessarily undefinable here
};

export type DecodedDeviceSigned = {
  get(key: 'nameSpaces'): CBORTag; // Major Type 24 (Encoded CBOR data item)
  get(key: 'deviceAuth'): DecodedDeviceSignedDeviceAuth;
};

export type DecodedDeviceSignedDeviceAuth = {
  get(key: 'deviceSignature'): COSESign1<
    MdocDeviceAuthProtectedBytes,
    CBORX5Chain,
    MobileSecurityObjectBytes
  >;
};

/**
 * https://datatracker.ietf.org/doc/html/rfc8152#section-4.2
 * [protected, unprotected, payload, signature]
 *
 * Headers:
 * - protected: https://datatracker.ietf.org/doc/html/rfc8152#section-3
 * - CBOR: bstr
 * - unprotected: https://datatracker.ietf.org/doc/html/rfc8152#section-3
 * - CBOR: map
 *
 * Payload
 * - https://datatracker.ietf.org/doc/html/rfc8152#section-4.1
 * - bstr | nil
 * -
 *
 * Signature
 * - bstr
 */
export type COSESign1<
  ProtectedType = COSESign1HeaderProtected,
  UnprotectedType = COSESign1HeaderUnprotected,
  PayloadType = COSESign1Payload,
> = [
  ProtectedType,
  UnprotectedType,
  PayloadType,
  COSESign1Signature,
];
export type COSESign1HeaderProtected = CBORType;
export type COSESign1HeaderUnprotected = Map<string | number, CBORType>;
export type COSESign1Payload = Uint8Array | undefined;
export type COSESign1Signature = Uint8Array;
