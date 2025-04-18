import { SimpleDigiCredsError } from '../../helpers/index.ts';
import type { OID4VPCredentialQuerySDJWT } from '../../protocols/oid4vp.ts';
import type { IssuerSignedJWTPayload } from './types.ts';

/**
 * Check Issuer-signed JWT claims for correctness
 *
 * @raises `SimpleDigiCredsError` with whatever claim was invalid
 */
export function assertIssuerSignedJWTClaims(
  claims: IssuerSignedJWTPayload,
  credentialQuery: OID4VPCredentialQuerySDJWT,
): void {
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

  const { vct_values } = credentialQuery.meta || {};
  if (vct_values) {
    // A credential type was specified in the request, but what we got back was not one of those
    // types
    if (!vct_values.includes(claims.vct)) {
      throw new SimpleDigiCredsError({
        message: `Issuer-signed JWT vct claim "${claims.vct}" was not one of ${
          JSON.stringify(vct_values)
        }`,
        code: 'SDJWTVerificationError',
      });
    }
  }
}
