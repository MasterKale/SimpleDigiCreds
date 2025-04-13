import type { CBORType } from '@levischuck/tiny-cbor';

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
  get(key: COSEKEYS.x): Uint8Array<ArrayBuffer> | undefined;
  // Setters
  set(key: COSEKEYS.crv, value: number): void;
  set(key: COSEKEYS.x, value: Uint8Array<ArrayBuffer>): void;
};

/**
 * Values specific to Elliptic Curve Cryptography public keys
 */
export type COSEPublicKeyEC2 = COSEPublicKey & {
  // Getters
  get(key: COSEKEYS.crv): number | undefined;
  get(key: COSEKEYS.x): Uint8Array<ArrayBuffer> | undefined;
  get(key: COSEKEYS.y): Uint8Array<ArrayBuffer> | undefined;
  // Setters
  set(key: COSEKEYS.crv, value: number): void;
  set(key: COSEKEYS.x, value: Uint8Array<ArrayBuffer>): void;
  set(key: COSEKEYS.y, value: Uint8Array<ArrayBuffer>): void;
};

/**
 * Values specific to RSA public keys
 */
export type COSEPublicKeyRSA = COSEPublicKey & {
  // Getters
  get(key: COSEKEYS.n): Uint8Array<ArrayBuffer> | undefined;
  get(key: COSEKEYS.e): Uint8Array<ArrayBuffer> | undefined;
  // Setters
  set(key: COSEKEYS.n, value: Uint8Array<ArrayBuffer>): void;
  set(key: COSEKEYS.e, value: Uint8Array<ArrayBuffer>): void;
};

/**
 * A type guard for determining if a COSE public key is an OKP key pair
 */
export function isCOSEPublicKeyOKP(
  cosePublicKey: COSEPublicKey,
): cosePublicKey is COSEPublicKeyOKP {
  const kty = cosePublicKey.get(COSEKEYS.kty);
  return isCOSEKty(kty) && kty === COSEKTY.OKP;
}

/**
 * A type guard for determining if a COSE public key is an EC2 key pair
 */
export function isCOSEPublicKeyEC2(
  cosePublicKey: COSEPublicKey,
): cosePublicKey is COSEPublicKeyEC2 {
  const kty = cosePublicKey.get(COSEKEYS.kty);
  return isCOSEKty(kty) && kty === COSEKTY.EC2;
}

/**
 * A type guard for determining if a COSE public key is an RSA key pair
 */
export function isCOSEPublicKeyRSA(
  cosePublicKey: COSEPublicKey,
): cosePublicKey is COSEPublicKeyRSA {
  const kty = cosePublicKey.get(COSEKEYS.kty);
  return isCOSEKty(kty) && kty === COSEKTY.RSA;
}

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

export function isCOSEKty(kty: number | undefined): kty is COSEKTY {
  return Object.values(COSEKTY).indexOf(kty as COSEKTY) >= 0;
}

/**
 * COSE Curves
 *
 * https://www.iana.org/assignments/cose/cose.xhtml#elliptic-curves
 */
export enum COSECRV {
  P256 = 1,
  P384 = 2,
  P521 = 3,
  ED25519 = 6,
  SECP256K1 = 8,
}

export function isCOSECrv(crv: number | undefined): crv is COSECRV {
  return Object.values(COSECRV).indexOf(crv as COSECRV) >= 0;
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

export function isCOSEAlg(alg: number | undefined): alg is COSEALG {
  return Object.values(COSEALG).indexOf(alg as COSEALG) >= 0;
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
export type COSESign1Payload = Uint8Array<ArrayBuffer> | undefined;
export type COSESign1Signature = Uint8Array<ArrayBuffer>;

/**
 * COSE_X509
 *
 * https://www.rfc-editor.org/rfc/rfc9360.html#tab-1
 */
export type CBORX5Chain = {
  get(key: COSEHEADER.X5CHAIN): COSEX509DERBytes | COSEX509DERBytes[];
};

/**
 * https://www.rfc-editor.org/rfc/rfc9360.html
 *
 * COSE_X509
 *
 * mdoc B.1.1 says X.509 chain certs are DER-encoded
 */
export type COSEX509DERBytes = Uint8Array<ArrayBuffer>;
