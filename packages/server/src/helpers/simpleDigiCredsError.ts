/**
 * A custom error to help detect issues specific to this library
 */
export class SimpleDigiCredsError extends Error {
  code: SimpleDigiCredsErrorCode;
  /**
   * When `code` is `'WalletErrorResponse'`, the error code the Wallet returned (e.g.
   * `"access_denied"`)
   */
  walletError?: string;

  constructor({
    message,
    code,
    cause,
    walletError,
  }: {
    message: string;
    code: SimpleDigiCredsErrorCode;
    cause?: Error;
    walletError?: string;
  }) {
    super(message, { cause });
    this.name = 'SimpleDigiCredsError';
    this.code = code;
    this.walletError = walletError;
  }
}

export type SimpleDigiCredsErrorCode =
  | 'InvalidPresentationOptions'
  | 'InvalidDCAPIResponse'
  | 'WalletErrorResponse'
  | 'MdocVerificationError'
  | 'SDJWTVerificationError'
  | 'SubtleCryptoError';
