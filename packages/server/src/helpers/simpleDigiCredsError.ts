/**
 * A custom error to help detect issues specific to this library
 */
export class SimpleDigiCredsError extends Error {
  code: SimpleDigiCredsErrorCode;

  constructor({
    message,
    code,
    cause,
  }: {
    message: string;
    code: SimpleDigiCredsErrorCode;
    cause?: Error;
  }) {
    super(message, { cause });
    this.name = 'SimpleDigiCredsError';
    this.code = code;
  }
}

export type SimpleDigiCredsErrorCode =
  | 'InvalidDCAPIResponse'
  | 'MdocVerificationError';
