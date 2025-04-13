export async function verifySDJWTPresentation(): Promise<VerifiedSDJWTPresentation> {
  return {
    verifiedClaims: [],
  };
}

export type VerifiedSDJWTPresentation = {
  verifiedClaims: [elemID: string, elemValue: unknown][];
};
