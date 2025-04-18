import { SimpleDigiCredsError } from '../../helpers/index.ts';
import type { IssuerSignedJWTPayload } from './types.ts';

/**
 * Check Issuer-signed JWT claims for correctness
 *
 * @raises `SimpleDigiCredsError` with whatever claim was invalid
 */
export function assertIssuerSignedJWTClaims({
  claims,
  allowedCredentialTypes,
}: {
  claims: IssuerSignedJWTPayload;
  allowedCredentialTypes?: string[];
}): void {
  // Ensure that the `exp` claim is some time after Now
  if (claims.exp) {
    const expirationDate = new Date(claims.exp * 1000);
    const currentDate = new Date();
    if (expirationDate <= currentDate) {
      throw new SimpleDigiCredsError({
        message: 'Issuer-signed JWT has expired',
        code: 'SDJWTVerificationError',
      });
    }
  }

  // Check if `vct` claim is one of the requested types, if any were specified
  if (!claims.vct) {
    throw new SimpleDigiCredsError({
      message: 'Issuer-signed JWT was missing vct claim',
      code: 'SDJWTVerificationError',
    });
  }

  if (allowedCredentialTypes) {
    // A credential type was specified in the request, but what we got back was not one of those
    // types
    if (!allowedCredentialTypes.includes(claims.vct)) {
      throw new SimpleDigiCredsError({
        message: `Issuer-signed JWT vct claim "${claims.vct}" was not one of ${
          JSON.stringify(allowedCredentialTypes)
        }`,
        code: 'SDJWTVerificationError',
      });
    }
  }
}
