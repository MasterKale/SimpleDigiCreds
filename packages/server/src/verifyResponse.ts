import type { DCAPIRequestOptions } from './dcapi.ts';
import { SimpleDigiCredsError } from './helpers/simpleDigiCredsError.ts';
import { isDCAPIResponse } from './helpers/isDCAPIResponse.ts';

/**
 * Verify and return a credential presentation out of a call to the Digital Credentials API
 */
export async function verifyResponse({ response, options }: {
  response: unknown;
  options: DCAPIRequestOptions;
}): Promise<VerifiedResponse> {
  // console.log({ response, options });

  if (!isDCAPIResponse(response)) {
    throw new SimpleDigiCredsError({
      message: 'Response was not the expected shape',
      code: 'InvalidDCAPIResponse',
    });
  }

  // TODO: We've verified the shape of the response, now verify it

  return {};
}

/**
 * Claims that could be successfully verified, mapped by requested credential ID
 */
export type VerifiedResponse = {
  [credID: string]: { [claimName: string]: unknown };
};
