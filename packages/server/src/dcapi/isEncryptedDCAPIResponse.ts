import { SimpleDigiCredsError } from '../helpers/index.ts';
import type { DCAPIEncryptedResponse } from './types.ts';

/**
 * Take `response.data` from the Digital Credential API and make sure it's an encrypted JWT
 */
export function isEncryptedDCAPIResponse(data: object): data is DCAPIEncryptedResponse {
  // @ts-ignore: Test for key presence
  if (typeof data.response !== 'string') {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: 'Required string `data.response` was missing (Encrypted Response)',
    });
  }

  // @ts-ignore: We know data.response is a string
  const jweSeparators = (data.response as string).match(/\./g);

  /**
   * Make sure the JWE has 5 segments
   * https://datatracker.ietf.org/doc/html/rfc7516#section-3.1
   */
  if (jweSeparators === null) {
    throw new SimpleDigiCredsError({
      message: '`data.response` was not a valid JWE',
      code: 'InvalidDCAPIResponse',
    });
  }

  // Four separators means five segments
  if (jweSeparators.length !== 4) {
    throw new SimpleDigiCredsError({
      message: '\`data.response\` JWE did not have 5 segments',
      code: 'InvalidDCAPIResponse',
    });
  }

  return true;
}
