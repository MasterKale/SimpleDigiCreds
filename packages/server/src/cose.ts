import type { CBORType } from 'jsr:@levischuck/tiny-cbor';

/**
 * Fundamental values that are needed to discern the more specific COSE public key types below.
 *
 * The use of `Maps` here is due to CBOR encoding being used with public keys, and the CBOR "Map"
 * type is being decoded to JavaScript's `Map` type instead of, say, a basic Object as us JS
 * developers might prefer.
 *
 * These types are an unorthodox way of saying "these Maps should involve these discrete lists of
 * keys", but it works.
 * @module
 */

/**
 * COSE public key common values
 */
export type COSEPublicKey = {
  // Getters
  get(key: COSEKEYS.kty): COSEKTY | undefined;
  get(key: COSEKEYS.alg): COSEALG | undefined;
  // Setters
  set(key: COSEKEYS.kty, value: COSEKTY): void;
  set(key: COSEKEYS.alg, value: COSEALG): void;
};

/**
 * Values specific to Octet Key Pair public keys
 */
export type COSEPublicKeyOKP = COSEPublicKey & {
  // Getters
  get(key: COSEKEYS.crv): number | undefined;
  get(key: COSEKEYS.x): Uint8Array | undefined;
  // Setters
  set(key: COSEKEYS.crv, value: number): void;
  set(key: COSEKEYS.x, value: Uint8Array): void;
};

/**
 * Values specific to Elliptic Curve Cryptography public keys
 */
export type COSEPublicKeyEC2 = COSEPublicKey & {
  // Getters
  get(key: COSEKEYS.crv): number | undefined;
  get(key: COSEKEYS.x): Uint8Array | undefined;
  get(key: COSEKEYS.y): Uint8Array | undefined;
  // Setters
  set(key: COSEKEYS.crv, value: number): void;
  set(key: COSEKEYS.x, value: Uint8Array): void;
  set(key: COSEKEYS.y, value: Uint8Array): void;
};

/**
 * COSE Keys
 *
 * https://www.iana.org/assignments/cose/cose.xhtml#key-common-parameters
 * https://www.iana.org/assignments/cose/cose.xhtml#key-type-parameters
 */
export enum COSEKEYS {
  kty = 1,
  alg = 3,
  crv = -1,
  x = -2,
  y = -3,
  n = -1,
  e = -2,
}

/**
 * COSE Key Types
 *
 * https://www.iana.org/assignments/cose/cose.xhtml#key-type
 */
export enum COSEKTY {
  OKP = 1,
  EC2 = 2,
  RSA = 3,
}

/**
 * COSE Header Parameters
 *
 * https://www.iana.org/assignments/cose/cose.xhtml#header-parameters
 */
export enum COSEHEADER {
  ALG = 1,
  X5CHAIN = 33,
}

/**
 * COSE Algorithms
 *
 * https://www.iana.org/assignments/cose/cose.xhtml#algorithms
 */
export enum COSEALG {
  ES256 = -7,
  EdDSA = -8,
  ES384 = -35,
  ES512 = -36,
  PS256 = -37,
  PS384 = -38,
  PS512 = -39,
  ES256K = -47,
  RS256 = -257,
  RS384 = -258,
  RS512 = -259,
  RS1 = -65535,
}

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

/**
 * COSE_X509
 *
 * https://www.rfc-editor.org/rfc/rfc9360.html#tab-1
 */
export type CBORX5Chain = {
  get(key: COSEHEADER.X5CHAIN): COSEX509DERBytes;
};

/**
 * https://www.rfc-editor.org/rfc/rfc9360.html
 *
 * COSE_X509
 *
 * mdoc B.1.1 says X.509 chain certs are DER-encoded
 */
export type COSEX509DERBytes = Uint8Array;
