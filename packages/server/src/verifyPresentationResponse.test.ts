import { assertEquals, assertExists, assertInstanceOf, assertRejects } from '@std/assert';

import type { DCAPIEncryptedResponse, DCAPIResponse } from './dcapi/types.ts';
import type { GeneratedPresentationRequest } from './generatePresentationRequest.ts';
import { verifyPresentationResponse } from './verifyPresentationResponse.ts';
import { SimpleDigiCredsError } from './helpers/index.ts';

const request: GeneratedPresentationRequest = {
  dcapiOptions: {
    digital: {
      requests: [
        {
          protocol: 'openid4vp',
          data: {
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
        },
      ],
    },
  },
  requestMetadata: {
    requestOrigin: 'http://localhost:8000',
    clientID: 'web-origin:http://localhost:8000',
  },
};

Deno.test('should error on missing `vp_token`', async () => {
  const data = {};
  // @ts-ignore: intentionally omitting vp_token
  const rejected = await assertRejects(() => verifyPresentationResponse({ data, request }));

  assertInstanceOf(rejected, SimpleDigiCredsError);
  assertEquals(rejected.code, 'InvalidDCAPIResponse');
  assertEquals(rejected.message, 'Required object `response.vp_token` was missing');
});

Deno.test('should error on bad `vp_token`', async () => {
  const data = { vp_token: '' };
  // @ts-ignore: intentionally malforming vp_token
  const rejected = await assertRejects(() => verifyPresentationResponse({ data, request }));

  assertInstanceOf(rejected, SimpleDigiCredsError);
  assertEquals(rejected.code, 'InvalidDCAPIResponse');
  assertEquals(rejected.message, 'Required object `response.vp_token` was missing');
});

Deno.test('should error on bad `vp_token` entries', async () => {
  const data = { vp_token: { cred1: 12345 } };
  // @ts-ignore: intentionally malforming vp_token
  const rejected = await assertRejects(() => verifyPresentationResponse({ data, request }));

  assertInstanceOf(rejected, SimpleDigiCredsError);
  assertEquals(rejected.code, 'InvalidDCAPIResponse');
  assertEquals(
    rejected.message,
    'Object `response.vp_token` contained non-string entries',
  );
});

Deno.test('should verify a well-formed unencrypted mdoc presentation', async () => {
  const _request: GeneratedPresentationRequest = {
    dcapiOptions: {
      digital: {
        requests: [
          {
            protocol: 'openid4vp',
            data: {
              response_type: 'vp_token',
              response_mode: 'dc_api',
              client_id: 'web-origin:http://localhost:8000',
              nonce: 'Glgd3WVI_6Uy8fjtI22ol0JGiJVq4GLuHGW6OCHV3_o',
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
    },
    requestMetadata: {
      requestOrigin: 'http://localhost:8000',
      clientID: 'web-origin:http://localhost:8000',
    },
  };

  const data: DCAPIResponse = {
    vp_token: {
      cred1:
        'o2d2ZXJzaW9uYzEuMGlkb2N1bWVudHOBo2dkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGxpc3N1ZXJTaWduZWSiam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xgtgYWFSkaGRpZ2VzdElEAGZyYW5kb21Qh2ub69pgXPJIlpOYhAJYX3FlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZWxlbGVtZW50VmFsdWVlU21pdGjYGFhRpGhkaWdlc3RJRAFmcmFuZG9tUJyft6VAh5wxzh_YqEvXtPBxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZWxlbGVtZW50VmFsdWVjSm9uamlzc3VlckF1dGiEQ6EBJqEYIVkCxDCCAsAwggJnoAMCAQICFB5_GzKtTzTv5LDMB7ew4zOnCxhNMAoGCCqGSM49BAMCMHkxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1Nb3VudGFpbiBWaWV3MRwwGgYDVQQKDBNEaWdpdGFsIENyZWRlbnRpYWxzMR8wHQYDVQQDDBZkaWdpdGFsY3JlZGVudGlhbHMuZGV2MB4XDTI1MDIxOTIzMzAxOFoXDTI2MDIxOTIzMzAxOFoweTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcxHDAaBgNVBAoME0RpZ2l0YWwgQ3JlZGVudGlhbHMxHzAdBgNVBAMMFmRpZ2l0YWxjcmVkZW50aWFscy5kZXYwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATreTYr4tfzl8NQBH2D4eNiLONVazYPamjHWLsN3Gr4bAmvml1dDZk5dhLDWieRlpjKAA_IpMABbM2ISHjYBeNpo4HMMIHJMB8GA1UdIwQYMBaAFKJP9InZfEbobqOG2UdIzsy-3M_1MB0GA1UdDgQWBBTf_mpaEunAYsS8mKcl0tlw93pgKDA0BgNVHR8ELTArMCmgJ6AlhiNodHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2L2NybDAqBgNVHRIEIzAhhh9odHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2MA4GA1UdDwEB_wQEAwIHgDAVBgNVHSUBAf8ECzAJBgcogYxdBQECMAoGCCqGSM49BAMCA0cAMEQCIGHFy_V8weN78uCxM9ofIDEEXXCbWiEUDnpoMJvLB0LnAiBwr6LhxJv7p4wVzAnlGe0Ef8pqYxshyE8NufwfR_ULAlkButgYWQG1pmd2ZXJzaW9uYzEuMG9kaWdlc3RBbGdvcml0aG1nU0hBLTI1Nmdkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGx2YWx1ZURpZ2VzdHOhcW9yZy5pc28uMTgwMTMuNS4xowBYIF4np1s8h5zq4R447fmweHJCW6Nd0X9qIlFVmdBckcxQAVgg5epO0W1CanUYkN3my72qMFM_NnUTmlUcXuYpkzhCK8ICWCAA5AsOZa7MqBIVYBoG7kGirGgnXgj2gW5ZN1MtEKKJvm1kZXZpY2VLZXlJbmZvoWlkZXZpY2VLZXmkAQIgASFYIITrf6TK84s7dF1jir4ZcQ3mnpOnnBLlOgI_rhbTqBfeIlgg4-d5b1QVCsUwKg3UoYLAn22ttZofjKqX6ajH0Jq7TeJsdmFsaWRpdHlJbmZvo2ZzaWduZWTAeBsyMDI1LTAyLTE5VDIzOjM2OjU4LjIxMDM5MVppdmFsaWRGcm9twHgbMjAyNS0wMi0xOVQyMzozNjo1OC4yMTAzOTlaanZhbGlkVW50aWzAeBsyMDM1LTAyLTA3VDIzOjM2OjU4LjIxMDM5OVpYQH2YP3brP6bfJDJO_FoaPUWwB5LtpYVYKChulL-3yQesOMekny68Gt-G9J3rEZMw7MUI64Y35nWJMqIF_9xB9zFsZGV2aWNlU2lnbmVkompuYW1lU3BhY2Vz2BhBoGpkZXZpY2VBdXRooW9kZXZpY2VTaWduYXR1cmWEQ6EBJqD2WED5fu2P8acn_hZHEmo2nm9LqmyWTbasEGiOatGJVn6hVIhfYrYyxRp5Zbo9CjdPKYkBhZeFQ25DMynanhsc7AvHZnN0YXR1cwA',
    },
  };

  const verified = await verifyPresentationResponse({ data, request: _request });

  assertEquals(
    verified,
    {
      cred1: {
        claims: {
          given_name: 'Jon',
          family_name: 'Smith',
        },
        issuerMeta: {
          expiresOn: new Date('2035-02-07T23:36:58.210Z'),
          issuedAt: new Date('2025-02-19T23:36:58.210Z'),
          validFrom: new Date('2025-02-19T23:36:58.210Z'),
        },
      },
    },
  );
});

Deno.test('should verify a well-formed unencrypted SD-JWT presentation', async () => {
  const _request: GeneratedPresentationRequest = {
    dcapiOptions: {
      digital: {
        requests: [
          {
            protocol: 'openid4vp',
            data: {
              response_type: 'vp_token',
              response_mode: 'dc_api',
              client_id: 'web-origin:http://localhost:8000',
              nonce: 'p58vuKZuAjkh3kJVgZhOf1l-6Z52uD8sBzgcCANs65Y',
              dcql_query: {
                credentials: [
                  {
                    id: 'cred1',
                    format: 'dc+sd-jwt',
                    meta: { vct_values: ['urn:eu.europa.ec.eudi:pid:1'] },
                    claims: [{ path: ['family_name'] }, { path: ['given_name'] }],
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
    requestMetadata: {
      requestOrigin: 'http://localhost:8000',
      clientID: 'web-origin:http://localhost:8000',
    },
  };

  const data: DCAPIResponse = {
    vp_token: {
      cred1:
        'eyJhbGciOiAiRVMyNTYiLCAidHlwIjogImRjK3NkLWp3dCIsICJ4NWMiOiBbIk1JSUM1VENDQW91Z0F3SUJBZ0lVQ1N6YzBVSWQ2Q0lISS9jYkluMUpzaWtQa1Mwd0NnWUlLb1pJemowRUF3SXdlVEVMTUFrR0ExVUVCaE1DVlZNeEV6QVJCZ05WQkFnTUNrTmhiR2xtYjNKdWFXRXhGakFVQmdOVkJBY01EVTF2ZFc1MFlXbHVJRlpwWlhjeEhEQWFCZ05WQkFvTUUwUnBaMmwwWVd3Z1EzSmxaR1Z1ZEdsaGJITXhIekFkQmdOVkJBTU1GbVJwWjJsMFlXeGpjbVZrWlc1MGFXRnNjeTVrWlhZd0hoY05NalV3TkRBME1UY3hPVFV6V2hjTk1qWXdOREEwTVRjeE9UVXpXakI1TVFzd0NRWURWUVFHRXdKVlV6RVRNQkVHQTFVRUNBd0tRMkZzYVdadmNtNXBZVEVXTUJRR0ExVUVCd3dOVFc5MWJuUmhhVzRnVm1sbGR6RWNNQm9HQTFVRUNnd1RSR2xuYVhSaGJDQkRjbVZrWlc1MGFXRnNjekVmTUIwR0ExVUVBd3dXWkdsbmFYUmhiR055WldSbGJuUnBZV3h6TG1SbGRqQlpNQk1HQnlxR1NNNDlBZ0VHQ0NxR1NNNDlBd0VIQTBJQUJKSmVnOVUxQUdtc05EOWNDOTY3c2kvdmU4WUNZanhiWlN5MWY2RWc3QWRpbmlQaDV4SVRiT1I2eGtDdW5xZy8xMUpPK0xtdkxLTU5BVmdOSWdFbFFZeWpnZkF3Z2Uwd0h3WURWUjBqQkJnd0ZvQVU4VmYza1hTMUU5WWV6eThhMHZyRFFuejVEeTR3SFFZRFZSME9CQllFRkNjYlk0WXlkNjNpc1Y1K2xHR3phTnFxbWJlY01DSUdBMVVkRVFRYk1CbUNGMlJwWjJsMFlXd3RZM0psWkdWdWRHbGhiSE11WkdWMk1EUUdBMVVkSHdRdE1Dc3dLYUFub0NXR0kyaDBkSEJ6T2k4dlpHbG5hWFJoYkMxamNtVmtaVzUwYVdGc2N5NWtaWFl2WTNKc01Db0dBMVVkRWdRak1DR0dIMmgwZEhCek9pOHZaR2xuYVhSaGJDMWpjbVZrWlc1MGFXRnNjeTVrWlhZd0RnWURWUjBQQVFIL0JBUURBZ2VBTUJVR0ExVWRKUUVCL3dRTE1Ba0dCeWlCakYwRkFRSXdDZ1lJS29aSXpqMEVBd0lEU0FBd1JRSWhBUFRFN2o2SENCNXZGUXIwbzhFdVViS3RBY0oxMTFNNTR0eHZxVGtnbDAyWUFpQjd3UUlnMkR4ckhzaHJVUGllQzFwRTVOWDNtZHB3eUI3QlB0Z1JCaGRBcXc9PSIsICJNSUlDdHpDQ0FsMmdBd0lCQWdJVUphOWJHREF3bStpampDcHZkNEFwWGE0QTNUWXdDZ1lJS29aSXpqMEVBd0l3ZVRFTE1Ba0dBMVVFQmhNQ1ZWTXhFekFSQmdOVkJBZ01Da05oYkdsbWIzSnVhV0V4RmpBVUJnTlZCQWNNRFUxdmRXNTBZV2x1SUZacFpYY3hIREFhQmdOVkJBb01FMFJwWjJsMFlXd2dRM0psWkdWdWRHbGhiSE14SHpBZEJnTlZCQU1NRm1ScFoybDBZV3hqY21Wa1pXNTBhV0ZzY3k1a1pYWXdIaGNOTWpVd05EQTBNVGN4T1RVeldoY05NelV3TXpJek1UY3hPVFV6V2pCNU1Rc3dDUVlEVlFRR0V3SlZVekVUTUJFR0ExVUVDQXdLUTJGc2FXWnZjbTVwWVRFV01CUUdBMVVFQnd3TlRXOTFiblJoYVc0Z1ZtbGxkekVjTUJvR0ExVUVDZ3dUUkdsbmFYUmhiQ0JEY21Wa1pXNTBhV0ZzY3pFZk1CMEdBMVVFQXd3V1pHbG5hWFJoYkdOeVpXUmxiblJwWVd4ekxtUmxkakJaTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEEwSUFCSWlHclNyWHBHeFEyZzJxSGUwSmU5L01qQnNHeXlJUXlUcVFqdFlXN1ppc3JyMXBPY2pqQnAweGRlZS94RmZKSyswTTNUZGJWQjJrbVhiM0hZc0V3NWlqZ2NJd2diOHdJZ1lEVlIwUkJCc3dHWUlYWkdsbmFYUmhiQzFqY21Wa1pXNTBhV0ZzY3k1a1pYWXdIUVlEVlIwT0JCWUVGUEZYOTVGMHRSUFdIczh2R3RMNncwSjgrUTh1TUI4R0ExVWRJd1FZTUJhQUZQRlg5NUYwdFJQV0hzOHZHdEw2dzBKOCtROHVNQklHQTFVZEV3RUIvd1FJTUFZQkFmOENBUUF3RGdZRFZSMFBBUUgvQkFRREFnRUdNQ29HQTFVZEVnUWpNQ0dHSDJoMGRIQnpPaTh2WkdsbmFYUmhiQzFqY21Wa1pXNTBhV0ZzY3k1a1pYWXdDUVlEVlIwZkJBSXdBREFLQmdncWhrak9QUVFEQWdOSUFEQkZBaUJPeHpiMlUrVThHRkY4YStHNngrd2k4Y2oxTkRFTjZlV0RQQTkzWTBRNjJ3SWhBUGpabHBVWmQzVC9FVFQrcnZGd2NIb3VSOEdkVFJoQ2FvL0VLNXRwNXV3dSJdfQ.eyJfc2QiOiBbIi1MaHlCOGxWNHVXdVpFQmdpR3BXUF9oZkZURTBWR2hSMFlnUUh4RFUxVTAiLCAiR3NEaENEaWxWb0pCcHEyUGxQMkVvRE1SX2w5ZVRGNXZxTnFjRUdjYmgxVSIsICJOZ1d0VmVxeTIwU3VGZm00Y185dmNuNTRIV2tkVy1veXVoU2t2c1pHZ1pBIl0sICJpc3MiOiAiaHR0cHM6Ly9kaWdpdGFsLWNyZWRlbnRpYWxzLmRldiIsICJpYXQiOiAxNjgzMDAwMDAwLCAiZXhwIjogMTg4MzAwMDAwMCwgInZjdCI6ICJ1cm46ZXUuZXVyb3BhLmVjLmV1ZGk6cGlkOjEiLCAiX3NkX2FsZyI6ICJzaGEtMjU2IiwgImNuZiI6IHsiandrIjogeyJrdHkiOiAiRUMiLCAiY3J2IjogIlAtMjU2IiwgIngiOiAiNWtjMWFJN2FiZVpsRmxxNmliZGxMWWRvY29tZTZva1ZBRWxOSi1uUkRVMCIsICJ5IjogIldLdDZEc1g2Mm83Ym5ZWHl5QTB4a19GRWZOU0hFcXBSZ1FPVmFhYldBdzAifX19.hQIYaxilAWlTFl7JR7RB-v6F1zJ7HCuki3UPS5l7i-fQSyoKyMTMA55UxwYTLWJdQvhl9HGYwPQdYw4SdYRZ4g~WyJpSHd0OVg5WEpxS05CVndUM3J5NlNRIiwgImZhbWlseV9uYW1lIiwgIk11c3Rlcm1hbm4iXQ~WyIwY3d0UTBQakJvaXBhZm1la3ZnVFRnIiwgImdpdmVuX25hbWUiLCAiRXJpa2EiXQ~eyJ0eXAiOiJrYitqd3QiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE3NDQ1MjM3OTYsImF1ZCI6IndlYi1vcmlnaW46aHR0cDovL2xvY2FsaG9zdDo4MDAwIiwibm9uY2UiOiJwNTh2dUtadUFqa2gza0pWZ1poT2YxbC02WjUydUQ4c0J6Z2NDQU5zNjVZIiwic2RfaGFzaCI6IkxaaGZIUlNadjJmME1acHVGZGNVWngtU3ZMRjdyWkJFYkNQQ3IzLUhScWcifQ.wzVXP4JaRwrTz2joNADUi8MdOufBOmSlY_pzAyjo4dxAZ5zoocZFeg-piJ8nqiiWiV51fC0xgtBRZrX37SRqaA',
    },
  };

  const verified = await verifyPresentationResponse({ data, request: _request });

  assertEquals(
    verified,
    {
      cred1: {
        claims: {
          given_name: 'Erika',
          family_name: 'Mustermann',
        },
        issuerMeta: {
          expiresOn: new Date('2029-09-01T23:33:20.000Z'),
          issuedAt: new Date('2023-05-02T04:00:00.000Z'),
          validFrom: undefined,
        },
      },
    },
  );
});

Deno.test('should verify an encrypted SD-JWT presentation', async () => {
  const _request: GeneratedPresentationRequest = {
    dcapiOptions: {
      digital: {
        requests: [
          {
            protocol: 'openid4vp',
            data: {
              response_type: 'vp_token',
              response_mode: 'dc_api.jwt',
              nonce: 'DPSphq_AUAqnetG7Vda0m5ygrduCoNR6AsmpRxUaI64',
              dcql_query: {
                credentials: [
                  {
                    id: 'cred1',
                    format: 'dc+sd-jwt',
                    meta: { vct_values: ['urn:eu.europa.ec.eudi:pid:1'] },
                    claims: [
                      { path: ['family_name'] },
                      { path: ['given_name'] },
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
                jwks: {
                  keys: [
                    {
                      kty: 'EC',
                      crv: 'P-256',
                      x: 'KLNpJOIrk6mYI9gWxvnRkK4vRMBg5L4Ck45bQTc4wq4',
                      y: 'aGFIxhvtP71Gdyk4A0FaK-cNB6cr4rve1E8Bz5AMbTk',
                    },
                  ],
                },
                authorization_encrypted_response_alg: 'ECDH-ES',
                authorization_encrypted_response_enc: 'A128GCM',
              },
            },
          },
        ],
      },
    },
    requestMetadata: {
      requestOrigin: 'http://localhost:8000',
      privateKeyJWK: {
        kty: 'EC',
        crv: 'P-256',
        x: 'KLNpJOIrk6mYI9gWxvnRkK4vRMBg5L4Ck45bQTc4wq4',
        y: 'aGFIxhvtP71Gdyk4A0FaK-cNB6cr4rve1E8Bz5AMbTk',
        d: 'tEI4CVPb2YSIeDstsb7wIWa650CgM8B4WhJQf2wClC0',
      },
      clientID: 'web-origin:http://localhost:8000',
    },
  };

  const data: DCAPIEncryptedResponse = {
    response:
      'eyJhcHUiOiIiLCJhcHYiOiIiLCJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTEyOEdDTSIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IkRySnRzV0NQX1QwbTVIbHhYc3FhbmVJQWlka1VfOWhGWjVaX1dHRkIxSWciLCJ5IjoiT1Y0QVJtekkzRUo5T05mTDVxZllKU01kMTJUZ3JNMDRkLXZ0cGZnVk15cyJ9fQ.._o-J0a2Yht93e4S_.CuyJZ5wFz-Tp6yZnfBdHBKV0IhRk0ZSK-4phJTcT_uGpvyJHuKKL7O9a8r2uGEjpM7YtnshXzrZydhbRLPCATEwJ5md6GknixV1AbtBbVdr7_1dBeK6lZiyRbffaKtC0RTnPrAPcOvBlPp8p9TCd4ZKobrqxJWAOSYDLanwSTo3XPpymbAtGVwumsUDT5ZH2kPP8NKUVPPBcalTs8_MwmE3d5g8L6Etnyo3xsDNhXn4ij9jVqRHqXExv4FL233N_8bRLRrNo1y6irb-GAaXUJW5FWrCp3tRfyPIqVu5AEFEzUaD5zC_ajoPWbsjDYP8W125l1JymrI4ZFPpcC2UZxFZilsOA-4fwD80abPOeXTtO12_-DbygKBN2iFQmToamIOuL8aH9_BAZrQwunXSkatP3LmTZEk6MUy8JptFCwy4eyJdy0lfD4I1JfoCVw8jXnd1lZS-d4pszIqz937E_rN6ylS2IFO7J-SJdgL2t59Bc-SWi5ZrbZwIg0Murtwp0LTz5ZCjoV7lScDeQ2iFSxwK_BGlvapSRVQMRcm8R2UTzqzccWNnbfqpJt_ulatarFmDLeUNJv3tbbE6rwVQcP5yUBYKaZeloyGIBdlxgqdmAWPXcF5aUQyx1l1Le6Vmq3B9-_HkweJ9nDfrw59bk1edzrbss2_iY3E11DL4RazQq2eGsF-iQRXYpXIERmrTA-sda9zwpDTKK6dnykbQOM4chJRFT-qUFJznRdOMqs0a9BVen0fj5VHmC-AGKhQCVyBsjQza4hthpOfyIeqWH7Mk6hrLc5oOTaxFiUTNHmCrW1w7oR80L8ACNS0BLti8ufy_YKVN4gOQ1O7INypMp2nR-bBp2gweSqoUzYynm9xBIGzX6Qw3Z6r3dg2mOcrjbI_5sBhQICsGcjUYDlPkPX9xcA2fNXg3jxuHKbgFo-bhdUi60v2fizYDDAJ5z8bSdlKgps-wuiOWWeVloaj1XeN3pDgAPDumCvb-Mye9w5WcQ5oFSrofjm3SraJe-S_KpppAH_q5pSrMF5itZuLGdyotWV4Yfoyj-6Hbjwhs25ItgRsJaoKmbQ2J44P5UBxTRvvwEcez2ZbSDQvosq93LMujp6eDxG6yock0NaX0FHufNtYJYYzuwE6trNY0wD6bEsaLWUxlcolbwO_Bbuc1howFgR9ddyz1-5I69KwdC9N1Pg998Nj4tUM9ijWdq_JnrXIwBsNq_0DiaU-A2mc4OkIcR6uRI6edIt5zp1OTRoGHCYB6BIZsd8SOw8qTsNSWBToGHwJa5xAj7vJbh-2ODhljGlNuhl2hnj7NJXo4kdAsq25aMRuRbUDsWJPOojwi_W5ZtSKyeBNUeto18I5SC1hbo8hT1JnvtGaJV9Fn-5Ec5FpUzLXw0OBCZJ3rKq-gTIBfhOVszvX9BaiVYDB5UjX9CfgBaXw6Hrza_8Q-TffAZGZnD6zO4tJu4peZ5fc2uobQ3dklJrvvonLjksOlZ1sjvLUTlRLa2hNDhTIlBgiq15ih7tuEHX7vaK-QPl5JMP30rODDBCMLC5WR5AFmZY1h6GZasnd93ivU8qXRodotiyd9PqSi9WOowvkyyGk7X7pG-8qveCcxXypxVX9kvSXbkynI_gkt4HRqYEtmf3HqwiddSjI-QC1rfR9J-vrKmu8OpyABRZ3D7L1GQRVFbZEdY5rwBTP5EgryVPdIdTuIHx9bKWcmeEJBuDIPipZEaOrLuJ59PyoayIcjkm9MTAVFGYJ5jivvWmKie9yg50ECDoBAZ-btero5F05FdvMcvNJrUZVK2-np6F6RYyQMLoIHdU2JF957v-2ZFqrpOjg-dQ1Vx-hd-visjsip4CrJUQJOyG-U61Tx3TA_1UkZZCfzgcIh8G4vedUhLAlltW6wXQOezJNSm9NJ8sFwYCawB5wG3ZXoYApexUGd5Vrnhqn-TKrMBsr5-CIiBt5dONJJRaAYfYd5t3-TaQKyUagQl8s2XAyfOjMuzc-J5SY7VBjY4n_9NDpSl6ueWSCY2oi9O7r4bYrqdbgrJoBcbQwqbdtDojlVkbJsOPS5BaVxkxX9WF25niamND3496B7wA3VLvnXyU7cK_TC37SMkZfxHMyTgzcFGoy8FOGy3z5qQQw3Vew7rksVNncXrRZ1XDIyPDeRW0Ezl68ImiE-8dezE-9DJKHkyIgYcg2I9LvD_QRknIfn-L-Gom2U3wZuV1bdfzHYa8sigz8V63w1w3S3ff60ridos1A8sPFXtQiSXP7f86oDGl5aAn570BzPGeZcwQjQkwIXU5_H0OgixTdGP2sybEu_5zUmAW1pqRq2wuyBMk9UHkSIhQnLYW58YPfImIvcYAEDCbpS1rJ3Xf0SYc5qIe48Hy19ctKAZZJrB2RCfX5u1A-RznnNLMSGIQ8KwtSvttGY509N1fQPAYp4AsUje7liMIChyO3FqJZRnJvfj5nj5MgKYyIXJVZnmkRwf_pq81hFjYecLq1CROA0Jn_jU6WQBlwEVveXdNMwrER7UjMAPEhLXu0GWpq5bteuev5lJF2deyE2NQikBBGfHVThaBKNl5sziaIA0Zaxaras8ZQ36eKLbTHqzImbhqdDFmh00aL1du6JELSwfVq5-08HciZ00ZQsga4Ic70bqiKgHM50DavBK6HN2h6OeZMfiKNRh2Md9uC9KlL-bgv0etW444k_UPDqNk8ltaLm61tK1_ngeB66XYnHH1t5KkKbVkWdrcONuhSyI0LWYBxeYwh73Gxssc2Qnzi-hPsaeCNbVkfGY-auSE7s9xnXDZaQSn0BhLCOPkz8-aRMuL8dUCykJmHO-jFeWUZgPiI8O9URrSllKWXw4fErM9EbH6T8TSA5SmEL4gLz9n8SVfNFSUtIt6zrqNqCodYMUpXwjKSVlZcRv4g1_wfDbmw9niZEZZ3dRoxlw02YyJBBs7yTHNQCpoWlSk8DkSAwi0qBJahcwiqWdXI0CbjNws_6zMf9onJBT78sYSv_X9ALYq1Ki6pAaiFzAtnldBWRzDgNPDSyN25SBY_FlHl9Gve4s-ixsTfVa4TXmu5iYDqpZysjvQ_olA1s1PhwvBQFOCb2aXAUzDUWXAnmcjtGMSHOAABR-fnSBIy7rrinC3IxRHMr_OioAGscbvj1s9L6BrZeb2fM-mHALE-AeCcusvV0RrQ3hjHoiAk9BEHB1wbc-3JvRSYdNL5uorxp31RjVJ3-fc1QgxqdPwNY0jLBjxHyDwZ-aPQQK8U1lNF9jhs4gnes_4b4E0qY83Qw24ZKXfwJzt3_aDKdK-O3vikn0J7oP-f2umeUiq_37JKsXVjsoqxQZiigdOY_lbF1OCId_T5VJlrerQc1FDsEIGo0l6Pfw3nC4EeEi7CKdO1awK3T785Kah19Fh1wQWEcmf861GZyA78eEkuDgBTr0v0jJJGZA8RTTHMofA3IIw30s4nAjkBg6Hd83_CQKx2EAivbc8fDMhzOErz_6Zb4ILRLr1vVnzIeK9QMbEpz6sb-DXHE8iWnj-F4qjKMwDpOK9JF2_ny2mr4DqJROdVwr3SOp4CZ0jWpN1vHEHlU8GJhmr0JuhFc33YvNZK4K0uqPnaRfvh-FSVQqkBBTi9bzoxS0aTx4KwFADobXtRruPJNzkiJfMQDWfkisnWPc1HYa-FqN7RkBHaW0YMQFyWdpESOGtKxlOIOaoEiDwhWwRLixPLGd55tK62XMgvYugPlPpC1ZDVUdxN1oKBdhlRPdj1ySITffmWiC8YbDTkek_nZ00z1L-DIdShriuqmlYZRHw4x3EcoesmXthuV4Mm9eCPDa5k-7RUzK3RNsM_hSSJD_MF_GrSV9G5VhUIswmMFWU7_ElUqP7eKF9T8CTFL1ovZk6wfOe9ml7xTSHhF3NVIKW_iafBP3xdZUZiN3v1Wxi8Vb2kgwOFqtBJ_x39jm-3ZSMlveQCjeWd2F9nQ6PBvy8maT7UxPgPZMd4Z66OA2yhK-DkbFq1819deBWuDvHFx3NZofhpXCWzRQYQm5FuLI8Ot1btX6PdDcxBEgghE2yvJM8IasLrKa2w3b-lElKlhQEur8xpKQFMpWbxOzGFwPiPsbyB65rJ2HGErPdUnCas9ILGAD9HR224g8VDuQm0q1_qkg5h8S5puaDM7PvpmpNQ7OnAFCClrpKhr21tUeFNZE62roE0JdbKnKJvuVNprBG4Mwgfxg83-5JxoWRWaHakIVB1gv4SHCliLzBLZNDYPUyg9GgM8BqjHgXnSxsMp4DJK6SawjX9dIJPMjrpiJ2Cts2XEoE5APoOtSoQ_bmQjPiSzkj_LGugyQV-PbL3UhrrwYVxDbgHLKS_xVsmVNSack18u8uxLEfBA_qDwZrL5Zrs1Q2mzkjXLzkN3VPLflVal9t_RIAWgdVZDbpyOdjpnl41QZg2VrNH9-XskH9dpr7wH4uv4ux0OIKbHopwBfKQoiK6uCXtS9nAZt8u8ihJl_pJ9VHQquHEs7lqKtUJH_5zHcMjQ9r_6FehWmT1XMlAmOTCzdURc93RAlFYqQgEBQNJcmduChBtiSva4OGXaAQidj-fICJikSFsMbzUi-ErTJZzTQLlWKkdGfWdInQtneg3X9zx7Kdytu0kY4z9DRsKhmmh0GhHehoh-frAm4zI0zoJVzh8L8-XSukGrheM0IaSprnNxVo4mNrg3bg650sWffAI0E2R-Ng7eToGQ7hSh8uytY6iFcUpPrQKiQ0SdMTKLUPpZoppMwjRpQj16BgxWaT8vmh-YxD7Z34tbvu4tmNun6v-xwCB8aE8cpkGWaO7u7UNE-NslrIIk6jp88_r0z3Vqy9G8KGkPv7NspL04baM8qF1BZZqAClZlrCnxzCon7wa1b7hdApB5jNG8vZaZ_4Or0je3-p5wkLNM_3-kko0BHxvo_bEPpKeSpFNU6rCJ7fqIxdYXUKVPD_nueXk6v9AiwMnxaBKeZOO0gfLTc-4iCFXb5ujcJ37X5lGc4TFTiMMs5qF9MKhQNqPbqE03-1javWu8BJo8wcnTmXEVzzdkbfMKNoGCTQoijmUbGcwZ6boswxXsCJFSp1-obUtiLCTGCZEMWZHC4lqPdDfWOBI4gBG-btkS-WAXBR8sszVvV.qYAt3q-HifRHs3E4ilNgsA',
  };

  const verified = await verifyPresentationResponse({ data, request: _request });

  assertEquals(
    verified,
    {
      cred1: {
        claims: {
          family_name: 'Mustermann',
          given_name: 'Erika',
        },
        issuerMeta: {
          expiresOn: new Date('2029-09-01T23:33:20.000Z'),
          issuedAt: new Date('2023-05-02T04:00:00.000Z'),
          validFrom: undefined,
        },
      },
    },
  );
});

Deno.test('should return all claims from a heterogenous mdoc presentation', async () => {
  const _request: GeneratedPresentationRequest = {
    dcapiOptions: {
      digital: {
        requests: [
          {
            protocol: 'openid4vp',
            data: {
              response_type: 'vp_token',
              response_mode: 'dc_api.jwt',
              nonce: 'OMQiYIhGDcsY_FFBrD-ysECe2mJCH4OVZBkb0Cb6taU',
              dcql_query: {
                credentials: [
                  {
                    id: 'cred1',
                    format: 'mso_mdoc',
                    meta: { doctype_value: 'org.iso.7367.1.mVRC' },
                    claims: [
                      { path: ['org.iso.23220.1', 'issue_date'] },
                      { path: ['org.iso.23220.1', 'issuing_authority_unicode'] },
                      { path: ['org.iso.7367.1', 'vehicle_holder'] },
                      { path: ['org.iso.7367.1', 'registration_number'] },
                    ],
                  },
                ],
              },
              client_metadata: {
                jwks: {
                  keys: [
                    {
                      kty: 'EC',
                      crv: 'P-256',
                      x: 'sBo1cKraLaOnbPNG2LL_m1l1cKO19zL4fy4W6ZAFiUo',
                      y: 'pDDVJwOa2uci_R7vk9v6iDBKJTAWO7C60X3UNnN9Msc',
                    },
                  ],
                },
                authorization_encrypted_response_alg: 'ECDH-ES',
                authorization_encrypted_response_enc: 'A128GCM',
              },
            },
          },
        ],
      },
    },
    requestMetadata: {
      requestOrigin: 'http://localhost:8000',
      privateKeyJWK: {
        kty: 'EC',
        crv: 'P-256',
        x: 'sBo1cKraLaOnbPNG2LL_m1l1cKO19zL4fy4W6ZAFiUo',
        y: 'pDDVJwOa2uci_R7vk9v6iDBKJTAWO7C60X3UNnN9Msc',
        d: 'Tqz2SJFK5O8f1m4BvjBjGTFTROfkd9vAZyq1LGqflcA',
      },
      clientID: 'web-origin:http://localhost:8000',
    },
  };

  const data: DCAPIEncryptedResponse = {
    response:
      'eyJhcHUiOiIiLCJhcHYiOiIiLCJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTEyOEdDTSIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6InNJTkpEdnZnRGlOc1U1MGJMcEluQ0JTYjFhcHUzXy03N0hEYUZrRlRwQlUiLCJ5IjoiUDljamlJY2lDc21jSl9janVJVXF6TktIWXYyYWpnSEVBM2U4YkNWZHdwcyJ9fQ..O2rFA74T2a1Rr5rD.tdnW8SJn0bmK1oKtIt-BVZUtOUrf5jNDH8qZlPE7US2ZPrsuLiHP9WQ8yOUFlVvZQU9psf4t3RP4utnMOcWhqbGWgXKiNk6mVB08LVAxguGuu0HdugwvDTB6y-ScmLOJHjlCihm5bamYAW4ksYptx0Dd2Ez4nuAkRZbKyW0A8uGSN3VWExe6vfvCSRaj9PEVB6yO_uTaYrSU1TS--u45CJgpALS0FyuueY9ryew8zKCHmGbfziA7em5bCM4rj3HhBhoigU1CCMKrT6mE_EnXU44NzCzp6X2Ta3VXXs396jquPXwq4Qs9N5EbivoSNvpBdA0p20QifxXuYAHpMgW6vTlld4ErIkxcXDnyuosE7l3BfPSoD5sAWSwoTBx6FEMCYtulwkWqZMRxas82Kt14PKunYiW22jJMDnaMWs3UPr5QjPXEU6Damjbmh5ycinjO6mxf6kOxmBO4Anu6ODT7Gtj0760weP5q3kPAbutfJrVLVPIf33TT3cybaPeWUBOTteN2SQiFb5Yl-wJoEgpJI7Yk-25XtUNwA56-u-PLI8aZ7XOtaUoLHxHnufkGE7Gq2kKIiXADgjpXI8bo3AwyEiZjw9p9grJh9ZfKfJGnx_gzXl1L3zk7zMj95VlVU0TPQ0fCQL_5vp1U77Fo-Z_BehRNKsyo1rGMIs_8E1Fj1j0dDq8fOo7RJW5SdHCt7M2cz1Em7DP0fMUJBWT6ZkxioYeidJDgT5iniGskeTuvJKo2DoT09GFxrwiB9-thH4o3cMFfIJFwaCAQeEH8T6C4QuKTiWBaWFydLpfw8zeKJe0YNTDaOYqtWoZk-Z9w-l1LshS7sv3SXhTaBtMkr30jNikDVMnB8s9JtibkriGfgfo3W3jYXFB48veW7wbfbKDGOsxZyzCQInNe2iSCaWb1xHmfOd95LKBWtqGk3Qe83_3YUXEwuvUhC19vmEiUbTEnhZHIObUKj-83Zl0ATooOkvxo3EbjWKElk7u1lHCc_hApJD7Zn6md35pOoS0OWq8n3HQ8VSC85iAf8s-E5UN2f9u70yESt9vnTgmQFphhXbMAJwEzwAgnzcT1J0jMWE-rmxqQWo44ifM-2lWQTKd-SRu8yUfsOhPSNNXvx2bZTBMd5GaRgLfrEk3r0xj4rUMXy0Daw3Bt3rQ0cZZxnFdtZYJZYevgxBKsDJH5hIGoTXWFb0IF-tlUm_NCfnmcJc20VxaKYokCtwolBPE9fm21N-Z-NHSYEklTqe_w8Oe_1mEggRV0gT6KSYiWJ7pds9AGAYoL59xGATgCOj5BROiyP8tgQboKrZu5PpeMuCLK6wnDwHFPk_KjmtA1PKqd_TJY_5QRfIu7uRbrj_B5JmTdJD_tUP7m0I3kUpttKu9z88LBY-VRCqnpVpk2GZND2dnN1ripbu1uZDfYcTMxXEJwrMbd_sIVw1pegBdF2m18__IGsr2GrFqFZUn9dSdbH34ydbrmrpTj2zM0FHpuLsWXTM9epF_yuEQWGdK-4i-eKJIc1CMMCEzmFU3KjgRb9uCZTUZ8SwLxKV7vYxq4Hf6K4nfG_foWLPZy-CAyg7gXH10e2ezaWtzjjZMvgrcuvNYSj-8kC-AIepyyDdeJ3vDZ7ff2Chy1xdwRTmkRZKLAl4TCP0unOATaKlVekWmKyYPm80X5H19u0GGL_feBV7VGelb6Mu6XTdlfq085uTvM0gT03zsdCfgn8SKhfcm9fCiDCgBUYqNLOWoJwmlq3ioAa4ADTvy3Lzcytme2xBh4GTz4HpVjHsh1FXcrVygpD-6kpN1eCi6dx1pkEANhQg1fQjVYZoradTkB3po41vUBuc6uePYueLxFkK6_aa_xfGbgMXU5AKfRRFkbO-y5m9lvJI28ec57YfsZb7gKCnbHNec3H3vd0v7DNdsEpubJ-KtzNIbr1Ugjn-AS_SVZKpk2qnJLGhnYVW2DtZVwvw1Nrfi_m9M4yXmPFWPtBehlOpnc3qQPyP52h3l3ZhpxfTKR9hClo5nAfnng4-yYeIkEor-e8pfaQtt6PxkQwukAGsZ3s0GdFWAxLm091IGQXhMeo_KBaA6h6j33V4lM0Z3EO9LT6SM3lnnk1KOg3RKSubC-jD48AXlOkj2tzyXkqGQnFDMEDhnK4vsepn_FWvrIqZ3yLjr0znoVeg-gGa0Fw2KqJEBUthK4sCE8cQYTaP4ChBrkBsPN5oaSNktqNLUgFxtQvD4eBnM-GTNKDd_ANVkyN5E01pFwHlAzqrxcPG6K65hwvJ7gUuT_wdsGNT4fRqGut21SbJoXtyOjidPgmFkW4CPISHszbBxW5KpATS1nP268NoDTecpWG9vpALP3c_hqFSXnqf1tLpuQ4O0-dnS_3gibps6RmIi6rbXLkggzCwVWJKO4cYc5xXvFXI_ybZKidn_-bY1KT4D8kMr2nx6k-A78gRYQYB0zk5M5Sj1y3tU8fUF1B27TyoV57mWHWBOTfcGLQOwqsv-y5HvrZ7YmcgZU7aLh0JOIAs12jl4h3qQVHEmhwIx2mihnti6ZTxwAasTb9ofydSxdAIySejpQ-ek-avg-z2PfENbdHhwtNy5ZjAulYZI4Hus84bWi6XBAW6GyGBuMjX8jL0UGOw_b4N1GRZbFz4COsYc8Ej3sCt6geatWcGTKdcr7Z4GbI67gaRJI4OD0gCGglN4C-Qp38VR3VHh6HeB4kAkGt-POyx1aDINOJqetYHQIvbovfuOVwT35o9-h6xfruH5-8CaAHRZ4x3K7gSSQuIW9QRcJbwnrimAWL70RehnrIfzRENh_-6sbfjJiX8GAy3P4btyytAPICpl4yJEL-8hMJHeTVIIFXtuGQvVqxmKgs8InVZpXqGFz1EPRmvujrQXZzR8Pj1XI_U1rRF7TlTJiRi9sUQARAMe163uWO-RWNx9gcyMWpfXacfIFXBOGm474QG54skIngX7oITaiT46hXB-mj8uOS6cXG_340te_BA4g-iAsU78FVqN5Eg6R1wUk2uxqz6XmlOhwt_C59mCq6SzmGhmQ-NaIXt5S6Afz7plFcCgroyvoPTtE59oHNEDXCxw-YVxN6rWmQqxXYUwFT0vAYvHomfEBjBt6O0JPu8TOrIYN6eli_9ox3w5opCEmCeusAQuSd2IQNzM7YtKAJG5rxDe12_W49ngMhwjznEw3PvIVKOieq4tYSk7YpVPeQMzCH9yVI7Rm9hNjyzf7Ojgf-gkl3Mre-NslPlMtYVDfRK1Lkyr8T-iuHeY3LEgyAkMIcQ6Mi85lIRid8GAr-dljZNVZxMwBOdxMwKvaJH_YWM17IgMHFAzzDejXYyl8gXI9Bo9zp5UZZoWZUSqP0_x39OnlIHuTORrisblKQKCYdSyCBgT9Bbi_CYaWJN6I0LsWFmMp4Wwo7i2YItIlp4KXeh2glrJvH7ohGmla43M8htafrTxUlAsj9SKm2n7pL6OkznWAr281V6pm938UTfi51-KnAaa3m6zPSJI0-h045x26Mm496_xbk7WsaKtjc8cELxJ3UHpo86SSeN4JypVvxqVrJ_EsWsesoQvZDmW1bhpBURDANKuMeTGETqWU1IS4ZO6dfT6KsTG3mmVZksYtJ4qa-RM5kV79u72Hps8rcnWj6erehckqROdkHQBFy9NS4rpKDOMViimdzD__d36Llx42T8JrEb6G5xYXLujc-Cjtw8yLgJfML7-QzFk4p6VPXvwjz6Z8gWyQDj1dPiyjaH8owRuc9zTG6CwGWAiGrZSB5ysrlBFu1ngUumup80iIhKCFX2T2ttTLo8fEMHDDNZKjEYUUoj6Z1Sqo9eTLoJbHTSUWZAdJ0VNbW1Vs7kcWBsz1-XwHYS-GM-wPaqDSfDDeli3bJbkSHgbJlo0MijK7iCHciewddESjlE0YRMeQjPX9GOOS37Oshf8-k2Ra2_0.NhIwmlgdJP0zW-kSAtDEAQ',
  };

  const verified = await verifyPresentationResponse({ data, request: _request });

  assertExists(verified.cred1);
  assertEquals(verified.cred1.claims.issue_date, '2022-01-01');
  assertEquals(verified.cred1.claims.issuing_authority_unicode, 'DC.dev');
  assertEquals(verified.cred1.claims.vehicle_holder, '94043');
  assertEquals(verified.cred1.claims.registration_number, '1941000043');
});
