export {
  type GeneratedPresentationRequest,
  generatePresentationRequest,
  type PresentationRequestOptions,
} from './generatePresentationRequest.ts';
export { verifyPresentationResponse } from './verifyPresentationResponse.ts';
export {
  SimpleDigiCredsError,
  type SimpleDigiCredsErrorCode,
} from './helpers/simpleDigiCredsError.ts';

export type {
  CredentialRequestOptions,
  DCAPIRequestOID4VP,
  DCAPIWalletErrorOID4VP,
  DigitalCredentialRequest,
  DigitalCredentialRequestOptions,
} from './dcapi/types.ts';

export type {
  OID4VPClaimQuery,
  OID4VPClaimQueryMdoc,
  OID4VPClientMetadata,
  OID4VPCredentialQuery,
  OID4VPCredentialQueryMDL,
  OID4VPCredentialQueryMdoc,
  OID4VPCredentialQuerySDJWTVC,
  OID4VPCredentialSetQuery,
  OID4VPDCQLQuery,
  OID4VPResponseEncryptionJWK,
  OID4VPSupportedMDLClaimName as OID4VPSupportedMdocClaimName,
  OID4VPTrustedAuthoritiesQuery,
  PathPointer,
} from './protocols/oid4vp/types.ts';
export type {
  OID4VPMDLCredentialOptions,
  OID4VPMdocCredentialOptionsFull,
  OID4VPMdocCredentialOptionsSimple,
  OID4VPSDJWTVCCredentialOptions,
} from './protocols/oid4vp/generateOID4VPRequest.ts';

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
