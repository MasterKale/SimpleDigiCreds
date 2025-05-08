import type { CBORTag, CBORType } from '@levischuck/tiny-cbor';

import type {
  CBORX5Chain,
  COSEALG,
  COSEHEADER,
  COSEPublicKeyEC2,
  COSEPublicKeyOKP,
} from '../../cose.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';

/**
 * 7.1 mDL document type and namespace
 */
export type NamespaceMDLv1 = 'org.iso.18013.5.1';
export type DocumentTypeMDLv1 = `${NamespaceMDLv1}.mDL`;

/**
 * List of mdoc identifiers
 */
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

export type IssuerAuth = COSESign1<
  MdocIssuerAuthProtectedBytes,
  CBORX5Chain,
  MobileSecurityObjectBytes
>;

export type MdocIssuerAuthProtectedBytes = Uint8Array_;
export type MdocIssuerAuthProtected = {
  /**
   * From mdoc 9.1.3.6:
   *
   * “ES256” (ECDSA with SHA-256), “ES384” (ECDSA with SHA-384), “ES512” (ECDSA with
   * SHA-512) or “EdDSA” (EdDSA).
   */
  get(
    key: COSEHEADER.ALG,
  ): COSEALG.ES256 | COSEALG.ES384 | COSEALG.ES512 | COSEALG.EdDSA;
};

export type MdocDeviceAuthProtectedBytes = Uint8Array_;
export type MdocDeviceAuthProtected = {
  /**
   * From mdoc 9.1.3.6:
   *
   * “ES256” (ECDSA with SHA-256), “ES384” (ECDSA with SHA-384), “ES512” (ECDSA with
   * SHA-512) or “EdDSA” (EdDSA).
   */
  get(
    key: COSEHEADER.ALG,
  ): COSEALG.ES256 | COSEALG.ES384 | COSEALG.ES512 | COSEALG.EdDSA;
};

export type MobileSecurityObjectBytes = Uint8Array_;
export type MobileSecurityObject = {
  get(key: 'version'): string; // Version of the MobileSecurityObject
  get(key: 'digestAlgorithm'): 'SHA-256' | 'SHA-384' | 'SHA-512'; // Message digest algorithm used
  get(key: 'valueDigests'): ValueDigests; // Digests of all data elements per namespace
  get(key: 'deviceKeyInfo'): DeviceKeyInfo;
  get(key: 'docType'): string; // docType as used in Documents
  get(key: 'validityInfo'): ValidityInfo;
};

export type ValidityInfo = {
  get(key: 'signed'): CBORTag;
  get(key: 'validFrom'): CBORTag;
  get(key: 'validUntil'): CBORTag;
};

export type ValueDigests = Map<string, Map<number, Uint8Array_>>;

/**  */
export type DeviceKeyInfo = {
  get(key: 'deviceKey'): COSEPublicKeyEC2 | COSEPublicKeyOKP;
  get(key: 'keyAuthorizations'): KeyAuthorizations;
};

/** */
export type KeyAuthorizations = {
  get(key: 'nameSpaces'): AuthorizedNameSpaces | undefined;
  get(key: 'dataElements'): AuthorizedDataElements | undefined;
};

export type AuthorizedNameSpaces = unknown; // Spec type: `[+ NameSpace]`
export type AuthorizedDataElements = unknown; // Spec type: `{+ NameSpace => DataElementsArray}`

export type DecodedIssuerSignedItem = {
  get(key: 'digestID'): number;
  get(key: 'random'): Uint8Array_;
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
export type COSESign1Payload = Uint8Array_ | undefined;
export type COSESign1Signature = Uint8Array_;

/**
 * Sig_structure
 *
 * https://datatracker.ietf.org/doc/html/rfc8152#section-4.4
 *
 * Structure:
 * ```
 * [context, body_protected, sign_protected, external_aad, payload]
 * ```
 */
export type COSESign1SigStructure = [
  context: 'Signature1',
  body_protected: Uint8Array_,
  sign_protected: Uint8Array_, // (should be empty)
  external_aad: Uint8Array_,
  payload: Uint8Array_,
];

/**
 * For some reason mdoc signature verification requires you to omit `external_aad` from
 * `COSESign1SigStructure`, despite the mdoc spec saying that "The external_aad structure shall be
 * a bytestring of size zero"
 */
export type MdocCOSESign1SigStructure = [
  context: 'Signature1',
  body_protected: Uint8Array_,
  sign_protected: Uint8Array_, // (should be empty)
  payload: Uint8Array_,
];

/**
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#appendix-B.2.6
 */
export type DCAPIOID4VPSessionTranscript = [
  deviceEngagementBytes: null,
  eReaderKeyBytes: null,
  handover: ['OpenID4VPDCAPIHandover', Uint8Array_],
];
