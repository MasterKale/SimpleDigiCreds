import * as base64 from '@hexagon/base64';
import { SimpleDigiCredsError } from './simpleDigiCredsError.ts';

export type DCAPIResponse = {
  vp_token: { [key: string]: string };
};

export type DCAPIVerifiedResponse = {
  [credID: string]: { [claimName: string]: unknown };
};

export function isDCAPIResponse(response: unknown): response is DCAPIResponse {
  if (!response) {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: 'Response was missing',
    });
  }

  if (typeof response !== 'object') {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: 'Response was not an object',
    });
  }

  // @ts-ignore: We know response is an object
  if (typeof response.vp_token !== 'object') {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: 'Required object `response.vp_token` was missing',
    });
  }

  // @ts-ignore: We know response.vp_token exists and is an object
  const presentationEntries: [unknown][] = Object.values(response.vp_token);
  let entriesValid = true;
  for (const cred of presentationEntries) {
    if (!entriesValid) {
      break;
    }

    entriesValid = typeof cred === 'string' && base64.validate(cred, true);
  }

  if (!entriesValid) {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: 'Object `response.tp_token` contained non-base64url-encoded entries',
    });
  }

  return true;
}
