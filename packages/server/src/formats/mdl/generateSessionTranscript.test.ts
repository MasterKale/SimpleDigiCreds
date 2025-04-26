import { assertEquals } from '@std/assert';

import type { CredentialRequestOptions } from '../../dcapi/types.ts';
import { generateSessionTranscript } from './generateSessionTranscript.ts';
import { base64url } from '../../helpers/index.ts';

Deno.test('should generate OID4VP-specific session transcript', async () => {
  const options: CredentialRequestOptions = {
    digital: {
      requests: [
        {
          protocol: 'openid4vp',
          data: {
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
        },
      ],
    },
  };

  const sessionTranscript = await generateSessionTranscript(
    options.digital.requests[0].data,
    {
      requestOrigin: 'http://localhost:8000',
      clientID: 'web-origin:http://localhost:8000',
    },
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
