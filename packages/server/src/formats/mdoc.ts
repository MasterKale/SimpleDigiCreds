import { CBORTag, CBORType } from 'jsr:@levischuck/tiny-cbor';

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
