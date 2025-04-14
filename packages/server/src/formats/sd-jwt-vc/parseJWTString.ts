import { base64url, SimpleDigiCredsError } from '../../helpers/index.ts';
import { JWTParts } from './types.ts';

/**
 * Take a JWT string and parse it into JSON data
 */
export function parseJWTString<Header = unknown, Payload = unknown>(
  value: string,
): [
  header: Header,
  payload: Payload,
  signature: string,
  rawSegments: JWTParts,
] {
  if (typeof value !== 'string') {
    throw new SimpleDigiCredsError({
      message: 'Input value was not a string',
      code: 'SDJWTVerificationError',
    });
  }

  const parts = value.split('.');

  if (parts.length !== 3) {
    throw new SimpleDigiCredsError({
      message: `JWT only had ${parts.length} parts, expected 3`,
      code: 'SDJWTVerificationError',
    });
  }

  if (!parts.every((val) => base64url.isBase64URLString(val))) {
    throw new SimpleDigiCredsError({
      message: `JWT parts were not all base64url-encoded strings`,
      code: 'SDJWTVerificationError',
    });
  }

  /**
   * From here on we know that the JWT string consisted of three base64url-encoded segments
   */
  const textDecoder = new TextDecoder();

  let header;
  try {
    const headerBytes = base64url.base64URLToBuffer(parts[0]);
    header = JSON.parse(textDecoder.decode(headerBytes));
  } catch (err: unknown) {
    const _err = err as Error;
    throw new SimpleDigiCredsError({
      message: 'Unable to parse JWT header, see cause',
      code: 'SDJWTVerificationError',
      cause: _err,
    });
  }

  let payload;
  try {
    const payloadBytes = base64url.base64URLToBuffer(parts[1]);
    payload = JSON.parse(textDecoder.decode(payloadBytes));
  } catch (err: unknown) {
    const _err = err as Error;
    throw new SimpleDigiCredsError({
      message: 'Unable to parse JWT payload, see cause',
      code: 'SDJWTVerificationError',
      cause: _err,
    });
  }

  return [header as Header, payload as Payload, parts[2], parts as [string, string, string]];
}
