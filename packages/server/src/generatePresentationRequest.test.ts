import { assertEquals } from '@std/assert';
import { stub } from '@std/testing/mock';

import { generatePresentationRequest } from './generatePresentationRequest.ts';
import { _generateNonceInternals } from './helpers/generateNonce.ts';

Deno.test('Should generate mDL options', () => {
  const mockGenerateNonce = stub(
    _generateNonceInternals,
    'stubThis',
    () => '9kMlSgHQW8oBv_AdkSaZKM0ajrEUatzg2f24vV6AgnI',
  );

  const options = generatePresentationRequest({
    credentialOptions: {
      format: 'mdl',
      desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      requestOrigin: 'https://digital-credentials.dev',
    },
  });

  assertEquals(
    options,
    {
      digital: {
        requests: [
          {
            protocol: 'openid4vp',
            data: {
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
          },
        ],
      },
    },
  );

  mockGenerateNonce.restore();
});

Deno.test('Should generate SD-JWT-VC options', () => {
  const mockGenerateNonce = stub(
    _generateNonceInternals,
    'stubThis',
    () => '9kMlSgHQW8oBv_AdkSaZKM0ajrEUatzg2f24vV6AgnI',
  );

  const options = generatePresentationRequest({
    credentialOptions: {
      format: 'sd-jwt',
      desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      requestOrigin: 'https://digital-credentials.dev',
      acceptedVCTValues: ['urn:eu.europa.ec.eudi:pid:1'],
    },
  });

  assertEquals(
    options,
    {
      digital: {
        requests: [
          {
            protocol: 'openid4vp',
            data: {
              response_type: 'vp_token',
              response_mode: 'dc_api',
              client_id: 'web-origin:https://digital-credentials.dev',
              nonce: '9kMlSgHQW8oBv_AdkSaZKM0ajrEUatzg2f24vV6AgnI',
              dcql_query: {
                credentials: [
                  {
                    id: 'cred1',
                    format: 'dc+sd-jwt',
                    meta: {
                      vct_values: ['urn:eu.europa.ec.eudi:pid:1'],
                    },
                    claims: [
                      { path: ['family_name'] },
                      { path: ['given_name'] },
                      { path: ['age_over_21'] },
                    ],
                  },
                ],
              },
              client_metadata: {
                vp_formats: {
                  'dc+sd-jwt': {
                    'sd-jwt_alg_values': ['ES256'],
                    'kb-jwt_alg_values': ['ES256'],
                  },
                },
              },
            },
          },
        ],
      },
    },
  );

  mockGenerateNonce.restore();
});
