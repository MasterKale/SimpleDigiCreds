import { assertEquals } from '@std/assert';

import { generateSessionTranscript } from './generateSessionTranscript.ts';
import { base64url } from '../../helpers/index.ts';

Deno.test('should generate OID4VP-specific session transcript', async () => {
  const sessionTranscript = await generateSessionTranscript(
    'http://localhost:8000',
    'web-origin:http://localhost:8000',
    'Y_Sl5cgcgTiw7XnikC24SCDvPEFb81gcOp3lrsdSwZ8',
  );

  assertEquals(
    sessionTranscript,
    [
      null,
      null,
      [
        'OpenID4VPDCAPIHandover',
        base64url.base64URLToBuffer('_PyOmRZ-t89FGXttog73cBXC1EGe9dQUICV3odM9ihk'),
      ],
    ],
  );
});
