import { assertEquals } from '@std/assert';
import { decodeHex, encodeHex } from '@std/encoding';
import { encodeCBOR } from '@levischuck/tiny-cbor';

import { generateSessionTranscript } from './generateSessionTranscript.ts';
import type { Uint8Array_ } from '../../helpers/types.ts';

Deno.test('matches OID4VP Draft 28 SessionTranscript test example', async () => {
  /**
   * Yes, I know it's weird that this test uses hex encoding when comparing outputs. These hex
   * strings were pulled from OID4VP Draft 28, so I'm keeping them as-is for sake of finding them
   * later within the spec with a simple copy-paste.
   *
   * Example pulled from here:
   * https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#appendix-B.2.6.1
   */
  const sessionTranscript = await generateSessionTranscript(
    'https://example.com',
    'exc7gBkxjx1rdc9udRrveKvSsJIq80avlXeLHhGwqtA',
    {
      kty: 'EC',
      crv: 'P-256',
      x: 'DxiH5Q4Yx3UrukE2lWCErq8N8bqC9CHLLrAwLz5BmE0',
      y: 'XtLM4-3h5o3HUH0MHVJV0kyq0iBlrBwlh8qEDMZ4-Pc',
      use: 'enc',
      alg: 'ECDH-ES',
      // @ts-ignore: It's in the example
      kid: '1',
    },
  );

  /** https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#appendix-B.2.6.1-9 */
  assertEquals(
    encodeHex(encodeCBOR(sessionTranscript) as Uint8Array_),
    '83f6f682764f70656e4944345650444341504948616e646f7665725820fbece366f4212f9762c74cfdbf83b8c69e371d5d68cea09cb4c48ca6daab761a',
  );

  /** https://openid.net/specs/openid-4-verifiable-presentations-1_0-28.html#appendix-B.2.6.1-13 */
  assertEquals(
    sessionTranscript,
    [
      null,
      null,
      [
        'OpenID4VPDCAPIHandover',
        decodeHex(
          'fbece366f4212f9762c74cfdbf83b8c69e371d5d68cea09cb4c48ca6daab761a',
        ),
      ],
    ],
  );
});
