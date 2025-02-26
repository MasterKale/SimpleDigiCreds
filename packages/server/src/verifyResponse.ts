import type { DCAPIRequestOptions } from './generateRequestOptions.ts';
import { SimpleDigiCredsError } from './simpleDigiCredsError.ts';
import { type DCAPIVerifiedResponse, isDCAPIResponse } from './types.ts';

export async function verifyResponse({
  response,
  options,
}: {
  response: unknown;
  options: DCAPIRequestOptions;
}): Promise<DCAPIVerifiedResponse> {
  console.log({ response, options });

  if (!isDCAPIResponse(response)) {
    throw new SimpleDigiCredsError({
      message: 'Response was not the expected shape',
      code: 'InvalidDCAPIResponse',
    });
  }

  return {};
}
