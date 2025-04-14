import type { DCAPIRequestOID4VP } from '../../dcapi.ts';
import { SimpleDigiCredsError } from '../../helpers/index.ts';

export async function verifySDJWTPresentation(
  presentation: string,
  request: DCAPIRequestOID4VP,
): Promise<VerifiedSDJWTPresentation> {
  // TODO: Verify overall shape of the string
  console.log(presentation);

  return {
    verifiedClaims: [],
  };
}

export type VerifiedSDJWTPresentation = {
  verifiedClaims: [elemID: string, elemValue: unknown][];
};
