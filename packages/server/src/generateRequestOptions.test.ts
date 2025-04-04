import { assertEquals } from '@std/assert';
import { stub } from '@std/testing/mock';

import { generateRequestOptions } from './index.ts';
import { _generateNonceInternals } from './helpers/generateNonce.ts';

Deno.test('Should generate options', () => {
  const mockGenerateNonce = stub(
    _generateNonceInternals,
    'stubThis',
    () => '9kMlSgHQW8oBv_AdkSaZKM0ajrEUatzg2f24vV6AgnI',
  );

  const options = generateRequestOptions({
    desiredClaims: ['family_name', 'given_name', 'age_over_21'],
    requestOrigin: 'https://digital-credentials.dev',
  });

  assertEquals(
    options,
    {
      digital: {
        requests: [
          {
            response_type: 'vp_token',
            response_mode: 'dc_api',
            client_id: 'web-origin:https://digital-credentials.dev',
            nonce: '9kMlSgHQW8oBv_AdkSaZKM0ajrEUatzg2f24vV6AgnI',
            dcql_query: {
              credentials: [
                {
                  id: 'cred1',
                  format: 'mso_mdoc',
                  meta: {
                    doctype_value: 'org.iso.18013.5.1.mDL',
                  },
                  claims: [
                    { path: ['org.iso.18013.5.1', 'family_name'] },
                    { path: ['org.iso.18013.5.1', 'given_name'] },
                    { path: ['org.iso.18013.5.1', 'age_over_21'] },
                  ],
                },
              ],
            },
          },
        ],
      },
    },
  );

  mockGenerateNonce.restore();
});
