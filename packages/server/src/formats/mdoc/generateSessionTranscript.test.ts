import { assertEquals } from '@std/assert';
import { encodeHex } from '@std/encoding';

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
          nonce: 'lsJ0WeQDAYetlVL22qc7c1sqPUr5eVPQVR2KKcyi0S4',
          dcql_query: {
            credentials: [
              {
                id: 'cred1',
                format: 'mso_mdoc',
                // @ts-ignore
                meta: { doctype_value: 'com.fido.phone' },
                claims: [
                  // @ts-ignore
                  { namespace: 'com.fido.phone.1', claim_name: 'phone_number' },
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
    encodeHex(sessionTranscript),
    'd818583a83f6f682734f4944345650444341504948616e646f766572582033d5ee243801d28fdc2e4dcaca2239e87ee09e2949f33110ef11178975977ed4',
  );
});
