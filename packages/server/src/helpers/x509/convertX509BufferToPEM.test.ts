import { assert, assertEquals } from '@std/assert';

import { convertX509BufferToPEM } from './convertX509BufferToPEM.ts';

Deno.test('should return pem when input is buffer', () => {
  const input = new Uint8Array(128).fill(0);
  const actual = convertX509BufferToPEM(input);
  const actualPemArr = actual.split('\n');
  assertEquals(
    actual,
    `-----BEGIN CERTIFICATE-----
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
-----END CERTIFICATE-----
`,
  );

  assertEquals(actualPemArr[0], '-----BEGIN CERTIFICATE-----');
  assert(actualPemArr[1].length <= 64);
  assert(actualPemArr[2].length <= 64);
  assert(actualPemArr[3].length <= 64);
  assertEquals(actualPemArr[4], '-----END CERTIFICATE-----');
});
