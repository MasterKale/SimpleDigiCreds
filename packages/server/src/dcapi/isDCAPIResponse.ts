import type { DCAPIResponse } from './types.ts';
import { SimpleDigiCredsError } from '../helpers/index.ts';

/**
 * Take `response.data` from the Digital Credential API and make sure it's the expected shape
 */
export function isDCAPIResponse(data: object): data is DCAPIResponse {
  // @ts-ignore: We know response is an object
  if (typeof data.vp_token !== 'object') {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: 'Required object `response.vp_token` was missing',
    });
  }

  // @ts-ignore: We know response.vp_token exists and is an object
  const presentationEntries: [unknown][] = Object.values(data.vp_token);
  let entriesValid = true;
  for (const cred of presentationEntries) {
    if (!entriesValid) {
      break;
    }

    entriesValid = typeof cred === 'string';
  }

  if (!entriesValid) {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: 'Object `response.vp_token` contained non-string entries',
    });
  }

  return true;
}
