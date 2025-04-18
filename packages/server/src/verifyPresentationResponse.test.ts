import { assertEquals, assertInstanceOf, assertRejects } from '@std/assert';

import type { CredentialRequestOptions, DCAPIResponse } from './dcapi.ts';
import { verifyPresentationResponse } from './verifyPresentationResponse.ts';
import { base64url, SimpleDigiCredsError } from './helpers/index.ts';

const options: CredentialRequestOptions = {
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
};

Deno.test('should error on missing `vp_token`', async () => {
  const response = {};
  const rejected = await assertRejects(() => verifyPresentationResponse({ response, options }));

  assertInstanceOf(rejected, SimpleDigiCredsError);
  assertEquals(rejected.code, 'InvalidDCAPIResponse');
  assertEquals(rejected.message, 'Required object `response.vp_token` was missing');
});

Deno.test('should error on bad `vp_token`', async () => {
  const response = { vp_token: '' };
  const rejected = await assertRejects(() => verifyPresentationResponse({ response, options }));

  assertInstanceOf(rejected, SimpleDigiCredsError);
  assertEquals(rejected.code, 'InvalidDCAPIResponse');
  assertEquals(rejected.message, 'Required object `response.vp_token` was missing');
});

Deno.test('should error on bad `vp_token` entries', async () => {
  const response = { vp_token: { cred1: 12345 } };
  const rejected = await assertRejects(() => verifyPresentationResponse({ response, options }));

  assertInstanceOf(rejected, SimpleDigiCredsError);
  assertEquals(rejected.code, 'InvalidDCAPIResponse');
  assertEquals(
    rejected.message,
    'Object `response.vp_token` contained non-base64url-encoded entries',
  );
});

Deno.test('should verify a well-formed mdoc presentation', async () => {
  const options: CredentialRequestOptions = {
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
  };

  const response: DCAPIResponse = {
    vp_token: {
      cred1:
        'o2d2ZXJzaW9uYzEuMGlkb2N1bWVudHOBo2dkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGxpc3N1ZXJTaWduZWSiam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xgtgYWFSkaGRpZ2VzdElEAGZyYW5kb21Qh2ub69pgXPJIlpOYhAJYX3FlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZWxlbGVtZW50VmFsdWVlU21pdGjYGFhRpGhkaWdlc3RJRAFmcmFuZG9tUJyft6VAh5wxzh_YqEvXtPBxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZWxlbGVtZW50VmFsdWVjSm9uamlzc3VlckF1dGiEQ6EBJqEYIVkCxDCCAsAwggJnoAMCAQICFB5_GzKtTzTv5LDMB7ew4zOnCxhNMAoGCCqGSM49BAMCMHkxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1Nb3VudGFpbiBWaWV3MRwwGgYDVQQKDBNEaWdpdGFsIENyZWRlbnRpYWxzMR8wHQYDVQQDDBZkaWdpdGFsY3JlZGVudGlhbHMuZGV2MB4XDTI1MDIxOTIzMzAxOFoXDTI2MDIxOTIzMzAxOFoweTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcxHDAaBgNVBAoME0RpZ2l0YWwgQ3JlZGVudGlhbHMxHzAdBgNVBAMMFmRpZ2l0YWxjcmVkZW50aWFscy5kZXYwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATreTYr4tfzl8NQBH2D4eNiLONVazYPamjHWLsN3Gr4bAmvml1dDZk5dhLDWieRlpjKAA_IpMABbM2ISHjYBeNpo4HMMIHJMB8GA1UdIwQYMBaAFKJP9InZfEbobqOG2UdIzsy-3M_1MB0GA1UdDgQWBBTf_mpaEunAYsS8mKcl0tlw93pgKDA0BgNVHR8ELTArMCmgJ6AlhiNodHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2L2NybDAqBgNVHRIEIzAhhh9odHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2MA4GA1UdDwEB_wQEAwIHgDAVBgNVHSUBAf8ECzAJBgcogYxdBQECMAoGCCqGSM49BAMCA0cAMEQCIGHFy_V8weN78uCxM9ofIDEEXXCbWiEUDnpoMJvLB0LnAiBwr6LhxJv7p4wVzAnlGe0Ef8pqYxshyE8NufwfR_ULAlkButgYWQG1pmd2ZXJzaW9uYzEuMG9kaWdlc3RBbGdvcml0aG1nU0hBLTI1Nmdkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGx2YWx1ZURpZ2VzdHOhcW9yZy5pc28uMTgwMTMuNS4xowBYIF4np1s8h5zq4R447fmweHJCW6Nd0X9qIlFVmdBckcxQAVgg5epO0W1CanUYkN3my72qMFM_NnUTmlUcXuYpkzhCK8ICWCAA5AsOZa7MqBIVYBoG7kGirGgnXgj2gW5ZN1MtEKKJvm1kZXZpY2VLZXlJbmZvoWlkZXZpY2VLZXmkAQIgASFYIITrf6TK84s7dF1jir4ZcQ3mnpOnnBLlOgI_rhbTqBfeIlgg4-d5b1QVCsUwKg3UoYLAn22ttZofjKqX6ajH0Jq7TeJsdmFsaWRpdHlJbmZvo2ZzaWduZWTAeBsyMDI1LTAyLTE5VDIzOjM2OjU4LjIxMDM5MVppdmFsaWRGcm9twHgbMjAyNS0wMi0xOVQyMzozNjo1OC4yMTAzOTlaanZhbGlkVW50aWzAeBsyMDM1LTAyLTA3VDIzOjM2OjU4LjIxMDM5OVpYQH2YP3brP6bfJDJO_FoaPUWwB5LtpYVYKChulL-3yQesOMekny68Gt-G9J3rEZMw7MUI64Y35nWJMqIF_9xB9zFsZGV2aWNlU2lnbmVkompuYW1lU3BhY2Vz2BhBoGpkZXZpY2VBdXRooW9kZXZpY2VTaWduYXR1cmWEQ6EBJqD2WED5fu2P8acn_hZHEmo2nm9LqmyWTbasEGiOatGJVn6hVIhfYrYyxRp5Zbo9CjdPKYkBhZeFQ25DMynanhsc7AvHZnN0YXR1cwA',
    },
  };

  const verified = await verifyPresentationResponse({ response, options });

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

Deno.test('should verify a well-formed SD-JWT presentation', async () => {
  const options: CredentialRequestOptions = {
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
                  client_metadata: {
                    vp_formats: {
                      'dc+sd-jwt': {
                        'sd-jwt_alg_values': ['ES256'],
                        'kb-jwt_alg_values': ['ES256'],
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
  };

  const response: DCAPIResponse = {
    vp_token: {
      cred1:
        'eyJhbGciOiAiRVMyNTYiLCAidHlwIjogImRjK3NkLWp3dCIsICJ4NWMiOiBbIk1JSUM1VENDQW91Z0F3SUJBZ0lVQ1N6YzBVSWQ2Q0lISS9jYkluMUpzaWtQa1Mwd0NnWUlLb1pJemowRUF3SXdlVEVMTUFrR0ExVUVCaE1DVlZNeEV6QVJCZ05WQkFnTUNrTmhiR2xtYjNKdWFXRXhGakFVQmdOVkJBY01EVTF2ZFc1MFlXbHVJRlpwWlhjeEhEQWFCZ05WQkFvTUUwUnBaMmwwWVd3Z1EzSmxaR1Z1ZEdsaGJITXhIekFkQmdOVkJBTU1GbVJwWjJsMFlXeGpjbVZrWlc1MGFXRnNjeTVrWlhZd0hoY05NalV3TkRBME1UY3hPVFV6V2hjTk1qWXdOREEwTVRjeE9UVXpXakI1TVFzd0NRWURWUVFHRXdKVlV6RVRNQkVHQTFVRUNBd0tRMkZzYVdadmNtNXBZVEVXTUJRR0ExVUVCd3dOVFc5MWJuUmhhVzRnVm1sbGR6RWNNQm9HQTFVRUNnd1RSR2xuYVhSaGJDQkRjbVZrWlc1MGFXRnNjekVmTUIwR0ExVUVBd3dXWkdsbmFYUmhiR055WldSbGJuUnBZV3h6TG1SbGRqQlpNQk1HQnlxR1NNNDlBZ0VHQ0NxR1NNNDlBd0VIQTBJQUJKSmVnOVUxQUdtc05EOWNDOTY3c2kvdmU4WUNZanhiWlN5MWY2RWc3QWRpbmlQaDV4SVRiT1I2eGtDdW5xZy8xMUpPK0xtdkxLTU5BVmdOSWdFbFFZeWpnZkF3Z2Uwd0h3WURWUjBqQkJnd0ZvQVU4VmYza1hTMUU5WWV6eThhMHZyRFFuejVEeTR3SFFZRFZSME9CQllFRkNjYlk0WXlkNjNpc1Y1K2xHR3phTnFxbWJlY01DSUdBMVVkRVFRYk1CbUNGMlJwWjJsMFlXd3RZM0psWkdWdWRHbGhiSE11WkdWMk1EUUdBMVVkSHdRdE1Dc3dLYUFub0NXR0kyaDBkSEJ6T2k4dlpHbG5hWFJoYkMxamNtVmtaVzUwYVdGc2N5NWtaWFl2WTNKc01Db0dBMVVkRWdRak1DR0dIMmgwZEhCek9pOHZaR2xuYVhSaGJDMWpjbVZrWlc1MGFXRnNjeTVrWlhZd0RnWURWUjBQQVFIL0JBUURBZ2VBTUJVR0ExVWRKUUVCL3dRTE1Ba0dCeWlCakYwRkFRSXdDZ1lJS29aSXpqMEVBd0lEU0FBd1JRSWhBUFRFN2o2SENCNXZGUXIwbzhFdVViS3RBY0oxMTFNNTR0eHZxVGtnbDAyWUFpQjd3UUlnMkR4ckhzaHJVUGllQzFwRTVOWDNtZHB3eUI3QlB0Z1JCaGRBcXc9PSIsICJNSUlDdHpDQ0FsMmdBd0lCQWdJVUphOWJHREF3bStpampDcHZkNEFwWGE0QTNUWXdDZ1lJS29aSXpqMEVBd0l3ZVRFTE1Ba0dBMVVFQmhNQ1ZWTXhFekFSQmdOVkJBZ01Da05oYkdsbWIzSnVhV0V4RmpBVUJnTlZCQWNNRFUxdmRXNTBZV2x1SUZacFpYY3hIREFhQmdOVkJBb01FMFJwWjJsMFlXd2dRM0psWkdWdWRHbGhiSE14SHpBZEJnTlZCQU1NRm1ScFoybDBZV3hqY21Wa1pXNTBhV0ZzY3k1a1pYWXdIaGNOTWpVd05EQTBNVGN4T1RVeldoY05NelV3TXpJek1UY3hPVFV6V2pCNU1Rc3dDUVlEVlFRR0V3SlZVekVUTUJFR0ExVUVDQXdLUTJGc2FXWnZjbTVwWVRFV01CUUdBMVVFQnd3TlRXOTFiblJoYVc0Z1ZtbGxkekVjTUJvR0ExVUVDZ3dUUkdsbmFYUmhiQ0JEY21Wa1pXNTBhV0ZzY3pFZk1CMEdBMVVFQXd3V1pHbG5hWFJoYkdOeVpXUmxiblJwWVd4ekxtUmxkakJaTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEEwSUFCSWlHclNyWHBHeFEyZzJxSGUwSmU5L01qQnNHeXlJUXlUcVFqdFlXN1ppc3JyMXBPY2pqQnAweGRlZS94RmZKSyswTTNUZGJWQjJrbVhiM0hZc0V3NWlqZ2NJd2diOHdJZ1lEVlIwUkJCc3dHWUlYWkdsbmFYUmhiQzFqY21Wa1pXNTBhV0ZzY3k1a1pYWXdIUVlEVlIwT0JCWUVGUEZYOTVGMHRSUFdIczh2R3RMNncwSjgrUTh1TUI4R0ExVWRJd1FZTUJhQUZQRlg5NUYwdFJQV0hzOHZHdEw2dzBKOCtROHVNQklHQTFVZEV3RUIvd1FJTUFZQkFmOENBUUF3RGdZRFZSMFBBUUgvQkFRREFnRUdNQ29HQTFVZEVnUWpNQ0dHSDJoMGRIQnpPaTh2WkdsbmFYUmhiQzFqY21Wa1pXNTBhV0ZzY3k1a1pYWXdDUVlEVlIwZkJBSXdBREFLQmdncWhrak9QUVFEQWdOSUFEQkZBaUJPeHpiMlUrVThHRkY4YStHNngrd2k4Y2oxTkRFTjZlV0RQQTkzWTBRNjJ3SWhBUGpabHBVWmQzVC9FVFQrcnZGd2NIb3VSOEdkVFJoQ2FvL0VLNXRwNXV3dSJdfQ.eyJfc2QiOiBbIi1MaHlCOGxWNHVXdVpFQmdpR3BXUF9oZkZURTBWR2hSMFlnUUh4RFUxVTAiLCAiR3NEaENEaWxWb0pCcHEyUGxQMkVvRE1SX2w5ZVRGNXZxTnFjRUdjYmgxVSIsICJOZ1d0VmVxeTIwU3VGZm00Y185dmNuNTRIV2tkVy1veXVoU2t2c1pHZ1pBIl0sICJpc3MiOiAiaHR0cHM6Ly9kaWdpdGFsLWNyZWRlbnRpYWxzLmRldiIsICJpYXQiOiAxNjgzMDAwMDAwLCAiZXhwIjogMTg4MzAwMDAwMCwgInZjdCI6ICJ1cm46ZXUuZXVyb3BhLmVjLmV1ZGk6cGlkOjEiLCAiX3NkX2FsZyI6ICJzaGEtMjU2IiwgImNuZiI6IHsiandrIjogeyJrdHkiOiAiRUMiLCAiY3J2IjogIlAtMjU2IiwgIngiOiAiNWtjMWFJN2FiZVpsRmxxNmliZGxMWWRvY29tZTZva1ZBRWxOSi1uUkRVMCIsICJ5IjogIldLdDZEc1g2Mm83Ym5ZWHl5QTB4a19GRWZOU0hFcXBSZ1FPVmFhYldBdzAifX19.hQIYaxilAWlTFl7JR7RB-v6F1zJ7HCuki3UPS5l7i-fQSyoKyMTMA55UxwYTLWJdQvhl9HGYwPQdYw4SdYRZ4g~WyJpSHd0OVg5WEpxS05CVndUM3J5NlNRIiwgImZhbWlseV9uYW1lIiwgIk11c3Rlcm1hbm4iXQ~WyIwY3d0UTBQakJvaXBhZm1la3ZnVFRnIiwgImdpdmVuX25hbWUiLCAiRXJpa2EiXQ~eyJ0eXAiOiJrYitqd3QiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE3NDQ1MjM3OTYsImF1ZCI6IndlYi1vcmlnaW46aHR0cDovL2xvY2FsaG9zdDo4MDAwIiwibm9uY2UiOiJwNTh2dUtadUFqa2gza0pWZ1poT2YxbC02WjUydUQ4c0J6Z2NDQU5zNjVZIiwic2RfaGFzaCI6IkxaaGZIUlNadjJmME1acHVGZGNVWngtU3ZMRjdyWkJFYkNQQ3IzLUhScWcifQ.wzVXP4JaRwrTz2joNADUi8MdOufBOmSlY_pzAyjo4dxAZ5zoocZFeg-piJ8nqiiWiV51fC0xgtBRZrX37SRqaA',
    },
  };

  const verified = await verifyPresentationResponse({ response, options });

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
        },
      },
    },
  );
});
