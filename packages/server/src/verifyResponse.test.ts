import { assertEquals, assertRejects } from 'jsr:@std/assert';

import type { DCAPIRequestOptions } from './generateRequestOptions.ts';
import { verifyResponse } from './verifyResponse.ts';

const options: DCAPIRequestOptions = {
  digital: {
    requests: [
      {
        response_type: 'vp_token',
        response_mode: 'dc_api',
        client_id: 'web-origin:http://localhost:8000',
        nonce: '9M90LkDtCtucTZq8brlkpKHnGf1HpQKCpPKYTPk5MaA',
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

Deno.test('should error on invalid DC API response', () => {
  const response = {};
  assertRejects(() => verifyResponse({ response, options }), 'invalid');
});
