import { assertEquals, assertExists } from '@std/assert';
import { stub } from '@std/testing/mock';

import { generatePresentationRequest } from './generatePresentationRequest.ts';
import { _generateNonceInternals } from './helpers/generateNonce.ts';

Deno.test('Should generate mDL options', async () => {
  const mockGenerateNonce = stub(
    _generateNonceInternals,
    'stubThis',
    () => '9kMlSgHQW8oBv_AdkSaZKM0ajrEUatzg2f24vV6AgnI',
  );

  const options = await generatePresentationRequest({
    credentialOptions: {
      format: 'mdl',
      desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      requestOrigin: 'https://digital-credentials.dev',
    },
  });

  assertEquals(
    options.dcapiOptions,
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

Deno.test('Should generate SD-JWT-VC options', async () => {
  const mockGenerateNonce = stub(
    _generateNonceInternals,
    'stubThis',
    () => '9kMlSgHQW8oBv_AdkSaZKM0ajrEUatzg2f24vV6AgnI',
  );

  const options = await generatePresentationRequest({
    credentialOptions: {
      format: 'sd-jwt',
      desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      requestOrigin: 'https://digital-credentials.dev',
      acceptedVCTValues: ['urn:eu.europa.ec.eudi:pid:1'],
    },
  });

  assertEquals(
    options.dcapiOptions,
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

Deno.test('Should generate options set up to encrypt response', async () => {
  const { dcapiOptions, requestMetadata } = await generatePresentationRequest({
    credentialOptions: {
      format: 'sd-jwt',
      desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      requestOrigin: 'https://digital-credentials.dev',
    },
    encryptResponse: true,
  });

  const { client_metadata } = dcapiOptions.digital.requests[0].data;

  assertEquals(dcapiOptions.digital.requests[0].data.response_mode, 'dc_api.jwt');
  assertEquals(client_metadata?.authorization_encrypted_response_alg, 'ECDH-ES');
  assertEquals(client_metadata?.authorization_encrypted_response_enc, 'A128GCM');
  // Make sure existing client_metadata entries aren't overwritten
  assertExists(client_metadata?.vp_formats);

  // Assert we're specifying a valid public key JWK
  assertExists(client_metadata?.jwks);
  assertEquals(client_metadata.jwks.keys.length, 1);
  assertEquals(client_metadata.jwks.keys[0].kty, 'EC');
  assertEquals(client_metadata.jwks.keys[0].crv, 'P-256');
  assertEquals(typeof client_metadata.jwks.keys[0].x, 'string');
  assertEquals(typeof client_metadata.jwks.keys[0].y, 'string');

  // Assert we have a valid private key JWK
  assertExists(requestMetadata.privateKeyJWK);
  assertEquals(requestMetadata.privateKeyJWK.kty, 'EC');
  assertEquals(requestMetadata.privateKeyJWK.crv, 'P-256');
  assertEquals(typeof requestMetadata.privateKeyJWK.x, 'string');
  assertEquals(typeof requestMetadata.privateKeyJWK.y, 'string');
  assertEquals(typeof requestMetadata.privateKeyJWK.d, 'string');

  // TODO: Verify public key in `jwks` encrypts something the private key JWKS can decrypt?
});
