import { assertEquals } from '@std/assert';
import { decodeHex } from '@std/encoding';

import type { DCAPIRequestOptions } from '../../dcapi.ts';
import { generateSessionTranscript } from './generateSessionTranscript.ts';

Deno.test('should generate OID4VP-specific session transcript', async () => {
  const options: DCAPIRequestOptions = {
    digital: {
      requests: [
        {
          response_type: 'vp_token',
          response_mode: 'dc_api',
          client_id: 'web-origin:http://localhost:8000',
          nonce: 'Y_Sl5cgcgTiw7XnikC24SCDvPEFb81gcOp3lrsdSwZ8',
          dcql_query: {
            credentials: [
              {
                id: 'cred1',
                format: 'mso_mdoc',
                meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
                claims: [
                  { path: ['org.iso.18013.5.1', 'family_name'] },
                  { path: ['org.iso.18013.5.1', 'given_name'] },
                ],
              },
            ],
          },
        },
      ],
    },
  };

  const sessionTranscript = await generateSessionTranscript(options.digital.requests[0]);

  assertEquals(
    sessionTranscript,
    [
      null,
      null,
      [
        'OpenID4VPDCAPIHandover',
        decodeHex('fcfc8e99167eb7cf45197b6da20ef77015c2d4419ef5d414202577a1d33d8a19'),
      ],
    ],
  );
});
