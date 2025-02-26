import { assertEquals, assertInstanceOf, assertRejects } from 'jsr:@std/assert';

import type { DCAPIRequestOptions, DCAPIResponse } from './dcapi.ts';
import { verifyResponse } from './verifyResponse.ts';
import { SimpleDigiCredsError } from './helpers/simpleDigiCredsError.ts';

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

Deno.test('should verify a well-formed presentation', async () => {
  const options: DCAPIRequestOptions = {
    digital: {
      requests: [
        {
          response_type: 'vp_token',
          response_mode: 'dc_api',
          client_id: 'web-origin:http://localhost:8000',
          nonce: 'mBXw_c--Hul_4e3BwYtb3gfligqNoLs4VliKL0LisQo',
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

  const response: DCAPIResponse = {
    vp_token: {
      cred1:
        'o2d2ZXJzaW9uYzEuMGlkb2N1bWVudHOBo2dkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGxpc3N1ZXJTaWduZWSiam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xgtgYWFSkaGRpZ2VzdElEAGZyYW5kb21Qh2ub69pgXPJIlpOYhAJYX3FlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZWxlbGVtZW50VmFsdWVlU21pdGjYGFhRpGhkaWdlc3RJRAFmcmFuZG9tUJyft6VAh5wxzh_YqEvXtPBxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZWxlbGVtZW50VmFsdWVjSm9uamlzc3VlckF1dGiEQ6EBJqEYIVkCxDCCAsAwggJnoAMCAQICFB5_GzKtTzTv5LDMB7ew4zOnCxhNMAoGCCqGSM49BAMCMHkxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1Nb3VudGFpbiBWaWV3MRwwGgYDVQQKDBNEaWdpdGFsIENyZWRlbnRpYWxzMR8wHQYDVQQDDBZkaWdpdGFsY3JlZGVudGlhbHMuZGV2MB4XDTI1MDIxOTIzMzAxOFoXDTI2MDIxOTIzMzAxOFoweTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcxHDAaBgNVBAoME0RpZ2l0YWwgQ3JlZGVudGlhbHMxHzAdBgNVBAMMFmRpZ2l0YWxjcmVkZW50aWFscy5kZXYwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATreTYr4tfzl8NQBH2D4eNiLONVazYPamjHWLsN3Gr4bAmvml1dDZk5dhLDWieRlpjKAA_IpMABbM2ISHjYBeNpo4HMMIHJMB8GA1UdIwQYMBaAFKJP9InZfEbobqOG2UdIzsy-3M_1MB0GA1UdDgQWBBTf_mpaEunAYsS8mKcl0tlw93pgKDA0BgNVHR8ELTArMCmgJ6AlhiNodHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2L2NybDAqBgNVHRIEIzAhhh9odHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2MA4GA1UdDwEB_wQEAwIHgDAVBgNVHSUBAf8ECzAJBgcogYxdBQECMAoGCCqGSM49BAMCA0cAMEQCIGHFy_V8weN78uCxM9ofIDEEXXCbWiEUDnpoMJvLB0LnAiBwr6LhxJv7p4wVzAnlGe0Ef8pqYxshyE8NufwfR_ULAlkButgYWQG1pmd2ZXJzaW9uYzEuMG9kaWdlc3RBbGdvcml0aG1nU0hBLTI1Nmdkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGx2YWx1ZURpZ2VzdHOhcW9yZy5pc28uMTgwMTMuNS4xowBYIF4np1s8h5zq4R447fmweHJCW6Nd0X9qIlFVmdBckcxQAVgg5epO0W1CanUYkN3my72qMFM_NnUTmlUcXuYpkzhCK8ICWCAA5AsOZa7MqBIVYBoG7kGirGgnXgj2gW5ZN1MtEKKJvm1kZXZpY2VLZXlJbmZvoWlkZXZpY2VLZXmkAQIgASFYIITrf6TK84s7dF1jir4ZcQ3mnpOnnBLlOgI_rhbTqBfeIlgg4-d5b1QVCsUwKg3UoYLAn22ttZofjKqX6ajH0Jq7TeJsdmFsaWRpdHlJbmZvo2ZzaWduZWTAeBsyMDI1LTAyLTE5VDIzOjM2OjU4LjIxMDM5MVppdmFsaWRGcm9twHgbMjAyNS0wMi0xOVQyMzozNjo1OC4yMTAzOTlaanZhbGlkVW50aWzAeBsyMDM1LTAyLTA3VDIzOjM2OjU4LjIxMDM5OVpYQH2YP3brP6bfJDJO_FoaPUWwB5LtpYVYKChulL-3yQesOMekny68Gt-G9J3rEZMw7MUI64Y35nWJMqIF_9xB9zFsZGV2aWNlU2lnbmVkompuYW1lU3BhY2Vz2BhBoGpkZXZpY2VBdXRooW9kZXZpY2VTaWduYXR1cmWEQ6EBJqD2WECSnswl_BwfD8SWDs2dLGpfXZw7qKbsGhcgOkeSaO_pDGNdl2DavIi-JgZbg4y_a6pIqsMAyfZ_-3I2oQ-LB-6IZnN0YXR1cwA',
    },
  };

  const verified = await verifyResponse({ response, options });

  console.log(verified);

  assertEquals(
    verified,
    {
      cred1: {
        given_name: 'Jon',
        family_name: 'Smith',
      },
    },
  );
});
