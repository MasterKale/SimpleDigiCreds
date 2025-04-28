export type SubtleCryptoAlg = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
export type SubtleCryptoCrv = 'P-256' | 'P-384' | 'P-521' | 'Ed25519';
export type SubtleCryptoKeyAlgName =
  | 'ECDSA'
  | 'Ed25519'
  | 'RSASSA-PKCS1-v1_5'
  | 'RSA-PSS';

/**
 * Equivalent to `Uint8Array` before TypeScript 5.7, and `Uint8Array<ArrayBuffer>` in TypeScript 5.7
 * and beyond.
 *
 * **Context**
 *
 * `Uint8Array` became a generic type in TypeScript 5.7, requiring types defined simply as
 * `Uint8Array` to be refactored to `Uint8Array<ArrayBuffer>` starting in Deno 2.2. `Uint8Array` is
 * _not_ generic in Deno 2.1.x and earlier, though, so this type helps bridge this gap.
 *
 * Inspired by Deno's std library:
 *
 * https://github.com/denoland/std/blob/b5a5fe4f96b91c1fe8dba5cc0270092dd11d3287/bytes/_types.ts#L11
 */
export type Uint8Array_ = ReturnType<Uint8Array['slice']>;

/**
 * Verified credentials and any present claims, mapped by requested credential ID. Also includes
 * various "`...meta`" values that can be used by the Verifier afterwards (e.g. policy-related
 * checks, etc...)
 */
export type VerifiedPresentation = {
  /**
   * TODO: Typing on this is kinda weird when working with output from this method. For example,
   * `verified.credential1.verifiedClaims` requires you to know that this library chose
   * "credential1" as the name when it generated credential request options. Can we collapse this
   * type so that it's `verified.verifiedClaims` instead?
   */
  [credID: string]: VerifiedCredential;
};

export type VerifiedCredential = {
  claims: VerifiedClaimsMap;
  issuerMeta: VerifiedCredentialIssuerMeta;
  credentialMeta: VerifiedCredentialMeta;
};

/**
 * Document claim values mapped by their claim name
 */
export type VerifiedClaimsMap = { [elemID: string]: unknown };

/**
 * Issuer-centric information pulled from the digital credential
 */
export type VerifiedCredentialIssuerMeta = {
  validFrom?: Date;
  expiresOn?: Date;
  issuedAt?: Date;
};

export type VerifiedCredentialMeta = {
  verifiedOrigin: string;
  // SD-JWT-VC-specific metadata
  /** Ex: "urn:eudi:pid:1" */
  vct?: string;
};
