import type { DCAPIResponse } from './types.ts';
import { SimpleDigiCredsError } from '../helpers/index.ts';

/**
 * Take `response.data` from the Digital Credential API and make sure it's the expected shape.
 *
 * OID4VP 1.0 requires each `vp_token` entry to be an array of one or more presentations:
 * https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-8.1
 */
export function parseDCAPIResponse(data: object): DCAPIResponse {
  // @ts-ignore: We know response is an object
  const vpToken: unknown = data.vp_token;

  if (!vpToken || typeof vpToken !== 'object') {
    throw new SimpleDigiCredsError({
      code: 'InvalidDCAPIResponse',
      message: 'Required object `response.vp_token` was missing',
    });
  }

  for (const entry of Object.values(vpToken)) {
    if (
      !Array.isArray(entry) ||
      entry.length < 1 ||
      !entry.every((presentation) => typeof presentation === 'string')
    ) {
      throw new SimpleDigiCredsError({
        code: 'InvalidDCAPIResponse',
        message: 'Object `response.vp_token` contained entries that were not arrays of strings',
      });
    }
  }

  return { vp_token: vpToken as DCAPIResponse['vp_token'] };
}
