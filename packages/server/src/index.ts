export {
  generatePresentationOptions,
  type MDLRequestOptions,
  type SDJWTRequestOptions,
} from './generatePresentationOptions.ts';
export { verifyPresentationResponse } from './verifyPresentationResponse.ts';

export type {
  CredentialRequestOptions,
  DCAPIRequestOID4VP,
  DigitalCredentialRequest,
  DigitalCredentialRequestOptions,
} from './dcapi.ts';

export type {
  OID4VPClaimQuery,
  OID4VPClaimQueryMdoc,
  OID4VPCredentialQuery,
  OID4VPCredentialQueryMdoc,
  OID4VPSupportedMdocClaimName,
  PathPointer,
} from './protocols/oid4vp.ts';

export type { DocumentTypeMDLv1, Identifier, NamespaceMDLv1 } from './formats/mdoc/types.ts';
export type {
  IssuerSignedJWTPayload,
  SDJWTHeader,
  SelectiveDisclosureAlgorithm,
} from './formats/sd-jwt-vc/types.ts';

export type {
  VerifiedClaimsMap,
  VerifiedCredential,
  VerifiedCredentialIssuerMeta,
} from './helpers/types.ts';
