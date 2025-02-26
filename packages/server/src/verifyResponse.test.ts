import { assertEquals, assertInstanceOf, assertRejects } from 'jsr:@std/assert';

import type { DCAPIRequestOptions } from './generateRequestOptions.ts';
import { verifyResponse } from './verifyResponse.ts';
import { SimpleDigiCredsError } from './simpleDigiCredsError.ts';

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

Deno.test('should error on missing `vp_token`', async () => {
  const response = {};
  const rejected = await assertRejects(() => verifyResponse({ response, options }));

  assertInstanceOf(rejected, SimpleDigiCredsError);
  assertEquals(rejected.code, 'InvalidDCAPIResponse');
  assertEquals(rejected.message, 'Required object `response.vp_token` was missing');
});

Deno.test('should error on bad `vp_token`', async () => {
  const response = { vp_token: '' };
  const rejected = await assertRejects(() => verifyResponse({ response, options }));

  assertInstanceOf(rejected, SimpleDigiCredsError);
  assertEquals(rejected.code, 'InvalidDCAPIResponse');
  assertEquals(rejected.message, 'Required object `response.vp_token` was missing');
});

Deno.test('should error on bad `vp_token` entries', async () => {
  const response = { vp_token: { cred1: '@@@@@' } };
  const rejected = await assertRejects(() => verifyResponse({ response, options }));

  assertInstanceOf(rejected, SimpleDigiCredsError);
  assertEquals(rejected.code, 'InvalidDCAPIResponse');
  assertEquals(
    rejected.message,
    'Object `response.tp_token` contained non-base64url-encoded entries',
  );
});
