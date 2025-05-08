import { assertEquals, assertExists, assertInstanceOf, assertRejects } from '@std/assert';
import { describe, it } from '@std/testing/bdd';
import { FakeTime } from '@std/testing/time';

import type { DCAPIEncryptedResponse, DCAPIResponse } from './dcapi/types.ts';
import { verifyPresentationResponse } from './verifyPresentationResponse.ts';
import { SimpleDigiCredsError } from './helpers/index.ts';

const serverAESKeySecret = new Uint8Array(32);

describe('Method: verifyPresentationResponse()', () => {
  it('should error on missing `vp_token`', async () => {
    const mockDate = new FakeTime(new Date('2025-04-28T17:40:48.169Z'));

    const rejected = await assertRejects(() =>
      verifyPresentationResponse({
        // @ts-ignore: intentionally omitting vp_token
        data: {},
        nonce:
          'dbWqM6ncJp_fKANnC0ZtPSop6Iek9dBJ64AuLz_00xQkLgd27acCjrVhcdZvV1BbP_ZyQ0N1dHk.S7UjKC6fLPJ5XRH8',
        expectedOrigin: '',
        serverAESKeySecret,
      })
    );

    assertInstanceOf(rejected, SimpleDigiCredsError);
    assertEquals(rejected.code, 'InvalidDCAPIResponse');
    assertEquals(rejected.message, 'Required object `response.vp_token` was missing');

    mockDate.restore();
  });

  it('should error on bad `vp_token`', async () => {
    const mockDate = new FakeTime(new Date('2025-04-28T17:40:48.169Z'));

    const rejected = await assertRejects(() =>
      verifyPresentationResponse({
        // @ts-ignore: intentionally malforming vp_token
        data: { vp_token: '' },
        nonce:
          'dbWqM6ncJp_fKANnC0ZtPSop6Iek9dBJ64AuLz_00xQkLgd27acCjrVhcdZvV1BbP_ZyQ0N1dHk.S7UjKC6fLPJ5XRH8',
        expectedOrigin: '',
        serverAESKeySecret,
      })
    );

    assertInstanceOf(rejected, SimpleDigiCredsError);
    assertEquals(rejected.code, 'InvalidDCAPIResponse');
    assertEquals(rejected.message, 'Required object `response.vp_token` was missing');

    mockDate.restore();
  });

  it('should error on bad `vp_token` entries', async () => {
    const mockDate = new FakeTime(new Date('2025-04-28T17:40:48.169Z'));

    const rejected = await assertRejects(() =>
      verifyPresentationResponse({
        // @ts-ignore: intentionally malforming vp_token
        data: { vp_token: { credential1: 12345 } },
        nonce:
          'dbWqM6ncJp_fKANnC0ZtPSop6Iek9dBJ64AuLz_00xQkLgd27acCjrVhcdZvV1BbP_ZyQ0N1dHk.S7UjKC6fLPJ5XRH8',
        expectedOrigin: '',
        serverAESKeySecret,
      })
    );

    assertInstanceOf(rejected, SimpleDigiCredsError);
    assertEquals(rejected.code, 'InvalidDCAPIResponse');
    assertEquals(
      rejected.message,
      'Object `response.vp_token` contained non-string entries',
    );

    mockDate.restore();
  });

  it('should verify a well-formed unencrypted mdoc presentation', async () => {
    const mockDate = new FakeTime(new Date('2025-04-30T01:13:06.486Z'));

    const data: DCAPIResponse = {
      vp_token: {
        credential1:
          'o2d2ZXJzaW9uYzEuMGlkb2N1bWVudHOBo2dkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGxpc3N1ZXJTaWduZWSiam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xgtgYWFSkaGRpZ2VzdElEAGZyYW5kb21Q-nu1-cjVol-l0SF4YMnOY3FlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZWxlbGVtZW50VmFsdWVlU21pdGjYGFhRpGhkaWdlc3RJRAFmcmFuZG9tUIlWHNIsMqspm9in4-l-ljtxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZWxlbGVtZW50VmFsdWVjSm9uamlzc3VlckF1dGiEQ6EBJqEYIVkCxDCCAsAwggJnoAMCAQICFB5_GzKtTzTv5LDMB7ew4zOnCxhNMAoGCCqGSM49BAMCMHkxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1Nb3VudGFpbiBWaWV3MRwwGgYDVQQKDBNEaWdpdGFsIENyZWRlbnRpYWxzMR8wHQYDVQQDDBZkaWdpdGFsY3JlZGVudGlhbHMuZGV2MB4XDTI1MDIxOTIzMzAxOFoXDTI2MDIxOTIzMzAxOFoweTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcxHDAaBgNVBAoME0RpZ2l0YWwgQ3JlZGVudGlhbHMxHzAdBgNVBAMMFmRpZ2l0YWxjcmVkZW50aWFscy5kZXYwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATreTYr4tfzl8NQBH2D4eNiLONVazYPamjHWLsN3Gr4bAmvml1dDZk5dhLDWieRlpjKAA_IpMABbM2ISHjYBeNpo4HMMIHJMB8GA1UdIwQYMBaAFKJP9InZfEbobqOG2UdIzsy-3M_1MB0GA1UdDgQWBBTf_mpaEunAYsS8mKcl0tlw93pgKDA0BgNVHR8ELTArMCmgJ6AlhiNodHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2L2NybDAqBgNVHRIEIzAhhh9odHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2MA4GA1UdDwEB_wQEAwIHgDAVBgNVHSUBAf8ECzAJBgcogYxdBQECMAoGCCqGSM49BAMCA0cAMEQCIGHFy_V8weN78uCxM9ofIDEEXXCbWiEUDnpoMJvLB0LnAiBwr6LhxJv7p4wVzAnlGe0Ef8pqYxshyE8NufwfR_ULAlkDGNgYWQMTpmd2ZXJzaW9uYzEuMG9kaWdlc3RBbGdvcml0aG1nU0hBLTI1Nmdkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGx2YWx1ZURpZ2VzdHOhcW9yZy5pc28uMTgwMTMuNS4xrQBYIDwZTozduEQhUpy4NmBJPpHR8vLiDVj1LOKrM9KxYmapAVggVQ6itAowLqQ6asA5heFxSGnNGHTy_VWZZzh0riCmXRsCWCCSN4rRJHbIHO1LEaFf2V9G3wncsc1_LVO6GmKRYYtqmwNYINP9RKCFpkNwDoB7DyNr-0-f8lo_YU3MXmWCw5fDaitoBFggnc71_E9RUUGxr2w1sv-KsEfjlr6BePZX9bQMCx7uEMsFWCAZ7pb2eLka54Si9OrrVAqJBE1FXixa_XO7J24WPy9GqwZYIIrFENBlJqwVnfjZ2QzTKA682Bkz49Dw1sB4b9j7WsYLB1ggV5jBXKNDUp2NCM9zS1Q2ht2oIlUIloJXGRhyZxukcbQIWCDBMCw3PR_n6lJLM9QHefTodB_oJ91dnJSnIS0EaUncjQlYIPtpSYaHmnC77O4y96KEb0ZqyJaERqEOByngmajsSCrOClggdcv5N_Ht0EKB_mrFvf9j6CpFUu1wsLxAVjiibfI91HwLWCDtzI8FYsUI9DWEULAlkiP0er-wc-WLCCggAXGQIvjhPgxYIICST4t-3X2cGav2hrv9kzwzpXq1L2GhOtxi_0TLXe2VbWRldmljZUtleUluZm-haWRldmljZUtleaQBAiABIVggIC8R0JuWtANCVsl6gFn7vGGgfsSwdOLZ8hgxKsUfxTQiWCCBPAkV1Kx81rm50sYU-Z5EGZtXe7YQ_Kzrqu2_-h7fD2x2YWxpZGl0eUluZm-jZnNpZ25lZMB4GzIwMjUtMDQtMzBUMDE6MDM6MDYuNDg2Mzk3Wml2YWxpZEZyb23AeBsyMDI1LTA0LTMwVDAxOjAzOjA2LjQ4NjQwNVpqdmFsaWRVbnRpbMB4GzIwMzUtMDQtMThUMDE6MDM6MDYuNDg2NDA2WlhAJnE23CRnkCk6pcqUYdnOr5KEQ1WRE9mGb4uv43h5ofRD0VLmIhleXLxZciRP5Uhc2AgeRJxO_DMxk9YKwRq7xmxkZXZpY2VTaWduZWSiam5hbWVTcGFjZXPYGEGgamRldmljZUF1dGihb2RldmljZVNpZ25hdHVyZYRDoQEmoPZYQHHwUuKXkZQw4Oks-IcN-uJYyz7qQO66qcojrmN8FojZ-J61wSbk081BThu-nqztlgvlyzRuiay6lAlM9Ht99ARmc3RhdHVzAA',
      },
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        'kvh5foFFM1B5DVfa1V-XSxFSs9KDl3FpH5OeSnd94-IXNmM-Z135M30EpEG1KBpw0Z0e1RokgiU.8wNgJK6fAsm1-1P0',
      expectedOrigin: ['http://localhost:8000'],
      serverAESKeySecret,
    });

    assertEquals(
      verified,
      {
        credential1: {
          claims: {
            given_name: 'Jon',
            family_name: 'Smith',
          },
          issuerMeta: {
            expiresOn: new Date('2035-04-18T01:03:06.486Z'),
            issuedAt: new Date('2025-04-30T01:03:06.486Z'),
            validFrom: new Date('2025-04-30T01:03:06.486Z'),
          },
          presentationMeta: { verifiedOrigin: 'http://localhost:8000' },
        },
      },
    );

    mockDate.restore();
  });

  it('should verify a well-formed unencrypted SD-JWT presentation', async () => {
    const mockDate = new FakeTime(new Date('2025-05-08T15:20:10.000Z'));

    const data: DCAPIResponse = {
      vp_token: {
        credential1:
          'eyJhbGciOiAiRVMyNTYiLCAidHlwIjogImRjK3NkLWp3dCIsICJ4NWMiOiBbIk1JSUM1akNDQW8yZ0F3SUJBZ0lVRVJjNEQzRVpQY25MdXg2N1ZWZDU4d2lrWGRjd0NnWUlLb1pJemowRUF3SXdlakVMTUFrR0ExVUVCaE1DVlZNeEV6QVJCZ05WQkFnTUNrTmhiR2xtYjNKdWFXRXhGakFVQmdOVkJBY01EVTF2ZFc1MFlXbHVJRlpwWlhjeEhEQWFCZ05WQkFvTUUwUnBaMmwwWVd3Z1EzSmxaR1Z1ZEdsaGJITXhJREFlQmdOVkJBTU1GMlJwWjJsMFlXd3RZM0psWkdWdWRHbGhiSE11WkdWMk1CNFhEVEkxTURReU5URTBNVEl5TmxvWERUSTJNRFF5TlRFME1USXlObG93ZWpFTE1Ba0dBMVVFQmhNQ1ZWTXhFekFSQmdOVkJBZ01Da05oYkdsbWIzSnVhV0V4RmpBVUJnTlZCQWNNRFUxdmRXNTBZV2x1SUZacFpYY3hIREFhQmdOVkJBb01FMFJwWjJsMFlXd2dRM0psWkdWdWRHbGhiSE14SURBZUJnTlZCQU1NRjJScFoybDBZV3d0WTNKbFpHVnVkR2xoYkhNdVpHVjJNRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUV1TGQ1aUhPK05UNlJzNDZwQkFrQWM4RW1mb3gvOGtqSXJFclF2UGFBSjMxemRWWEV2a1pPZFFqV0wydy9xblJKZ2c4c2hETnp5RUZ0UENqMTg0WExGcU9COERDQjdUQWZCZ05WSFNNRUdEQVdnQlQ2aVpRaFo4NG83Mi9lWGZyZHpxMXBUSTdQQ2pBZEJnTlZIUTRFRmdRVWc3ZE1LSjViaElVTnBsS2RmWFlhUkdQQ2dOVXdJZ1lEVlIwUkJCc3dHWUlYWkdsbmFYUmhiQzFqY21Wa1pXNTBhV0ZzY3k1a1pYWXdOQVlEVlIwZkJDMHdLekFwb0NlZ0pZWWphSFIwY0hNNkx5OWthV2RwZEdGc0xXTnlaV1JsYm5ScFlXeHpMbVJsZGk5amNtd3dLZ1lEVlIwU0JDTXdJWVlmYUhSMGNITTZMeTlrYVdkcGRHRnNMV055WldSbGJuUnBZV3h6TG1SbGRqQU9CZ05WSFE4QkFmOEVCQU1DQjRBd0ZRWURWUjBsQVFIL0JBc3dDUVlIS0lHTVhRVUJBakFLQmdncWhrak9QUVFEQWdOSEFEQkVBaUFnR3VXekxpdnJGbTRWOU45SEN5Z1ErbHU2am9zN2FlZ0d1N2xaOEs1WFFRSWdLM1N0Rm5nL2YwTTdhcUZGWGs1S0VUUTN1UUZtY3JUcVE3eHJwWWF3dTFNPSIsICJNSUlDdVRDQ0FsK2dBd0lCQWdJVVE3aG5TbTNrSWRGdUFOYW5GcGs0ekVkeW4xc3dDZ1lJS29aSXpqMEVBd0l3ZWpFTE1Ba0dBMVVFQmhNQ1ZWTXhFekFSQmdOVkJBZ01Da05oYkdsbWIzSnVhV0V4RmpBVUJnTlZCQWNNRFUxdmRXNTBZV2x1SUZacFpYY3hIREFhQmdOVkJBb01FMFJwWjJsMFlXd2dRM0psWkdWdWRHbGhiSE14SURBZUJnTlZCQU1NRjJScFoybDBZV3d0WTNKbFpHVnVkR2xoYkhNdVpHVjJNQjRYRFRJMU1EUXlOVEUwTVRJeU5sb1hEVE0xTURReE16RTBNVEl5Tmxvd2VqRUxNQWtHQTFVRUJoTUNWVk14RXpBUkJnTlZCQWdNQ2tOaGJHbG1iM0p1YVdFeEZqQVVCZ05WQkFjTURVMXZkVzUwWVdsdUlGWnBaWGN4SERBYUJnTlZCQW9NRTBScFoybDBZV3dnUTNKbFpHVnVkR2xoYkhNeElEQWVCZ05WQkFNTUYyUnBaMmwwWVd3dFkzSmxaR1Z1ZEdsaGJITXVaR1YyTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFcUlEL0lLV21UMGVlYmQzaEd5OEIwQ2R6VDlxclliOG5IYVFSNGJFNG5YUVFCSEF3ZFd5bTJqakxmYjVXbzJzSCtSdkZrRkFwUG5tdjBhcFA3SXkwaTZPQndqQ0J2ekFpQmdOVkhSRUVHekFaZ2hka2FXZHBkR0ZzTFdOeVpXUmxiblJwWVd4ekxtUmxkakFkQmdOVkhRNEVGZ1FVK29tVUlXZk9LTzl2M2wzNjNjNnRhVXlPendvd0h3WURWUjBqQkJnd0ZvQVUrb21VSVdmT0tPOXYzbDM2M2M2dGFVeU96d293RWdZRFZSMFRBUUgvQkFnd0JnRUIvd0lCQURBT0JnTlZIUThCQWY4RUJBTUNBUVl3S2dZRFZSMFNCQ013SVlZZmFIUjBjSE02THk5a2FXZHBkR0ZzTFdOeVpXUmxiblJwWVd4ekxtUmxkakFKQmdOVkhSOEVBakFBTUFvR0NDcUdTTTQ5QkFNQ0EwZ0FNRVVDSUEwdFc0ayt1SEFsOXRmNFdOa3NxRVIwT1JLK2pHd1NoV2Z2RjJtVzZKenZBaUVBaGhjQUxxNm1sSmd2MThwZnpjZ1B6N3lPMTc1bmxFWTF0ZVlpYVBmWWlucz0iXX0.eyJfc2QiOiBbIjVtdmxDUWtLLUpxR0RHZmtDUXF0LXJnZ0R1d193OWJ4bDMyemNuWVNKSGciLCAiZHVRYXYtQlVQX2xTcTdPMEhLTi1vZVV4ZjlfUTBISFlpdWFLYXpzYVZVVSIsICJnbS13WDRzOUU1TWFYSXczTUpMX2pVa0xYM3BxVllMR04zanF3UVFURExvIl0sICJpc3MiOiAiaHR0cHM6Ly9kaWdpdGFsLWNyZWRlbnRpYWxzLmRldiIsICJpYXQiOiAxNjgzMDAwMDAwLCAiZXhwIjogMTg4MzAwMDAwMCwgInZjdCI6ICJ1cm46ZXUuZXVyb3BhLmVjLmV1ZGk6cGlkOjEiLCAiX3NkX2FsZyI6ICJzaGEtMjU2IiwgImNuZiI6IHsiandrIjogeyJrdHkiOiAiRUMiLCAiY3J2IjogIlAtMjU2IiwgIngiOiAiZWxjY3B2T0s0cEx4MTF3cXhvZmpqblpPa3VBclRaLVFubHE3WGFwTmd6RSIsICJ5IjogIkV4RWZoOVZmbEtRZ1poTmp3ajRfUi1mZUFHZ0dFdi1kd2FvbUt3TGExYmMifX19.ohPtKE-8-g_InMt4rp3AW2S5r0iE7-mgZDfOV8jhxTgJDkJvG12QFaRJxWFwM22n7PSTjpcQx9-74ao8b9o44g~WyJuYWp5YjM2aDFLWFZHU3NNd19QNDNnIiwgImZhbWlseV9uYW1lIiwgIk11c3Rlcm1hbm4iXQ~WyIweUgxenVNTl9PZmc0aFNHNWpWanJRIiwgImdpdmVuX25hbWUiLCAiRXJpa2EiXQ~eyJ0eXAiOiJrYitqd3QiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE3NDY3MTc2MTAsImF1ZCI6Im9yaWdpbjpodHRwOi8vbG9jYWxob3N0OjgwMDAiLCJub25jZSI6InNzclZkNVNDbThlZml3VkZMZm50WkVFRzAyQVRJY1k1VldmSGNjaW1nV21pOVJxRUg3ZFpmbzZtYjZDSXJpdW1lVmhfbWxTUl92dy5wdzlKdjF4YnMtLWNqWllZIiwic2RfaGFzaCI6IjhDSlpPc3JVMVJPQVlJWjdqOU1lV3FJd2FRa1o0VWlHOExfX2s3bnhJWGMifQ.7jSJri8HAKx4dKp6kWrtJvAb0ym6khT3dEtXY9ZjEPUbYxziKfp1sfVkF-yJaXkwY_OO5l6YTL7sLPCVozlHxg',
      },
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        'ssrVd5SCm8efiwVFLfntZEEG02ATIcY5VWfHccimgWmi9RqEH7dZfo6mb6CIriumeVh_mlSR_vw.pw9Jv1xbs--cjZYY',
      expectedOrigin: 'http://localhost:8000',
      serverAESKeySecret,
    });

    assertEquals(
      verified,
      {
        credential1: {
          claims: {
            given_name: 'Erika',
            family_name: 'Mustermann',
          },
          issuerMeta: {
            expiresOn: new Date('2029-09-01T23:33:20.000Z'),
            issuedAt: new Date('2023-05-02T04:00:00.000Z'),
            validFrom: undefined,
          },
          presentationMeta: {
            verifiedOrigin: 'http://localhost:8000',
            vct: 'urn:eu.europa.ec.eudi:pid:1',
          },
        },
      },
    );

    mockDate.restore();
  });

  it('should verify an encrypted SD-JWT presentation', async () => {
    const mockDate = new FakeTime(new Date('2025-05-08T15:23:04.000Z'));

    const data: DCAPIEncryptedResponse = {
      response:
        'eyJhcHUiOiIiLCJhcHYiOiIiLCJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTEyOEdDTSIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IkNSam9CYnBPVGQyTXdtOGVQUVBtSkJnUjNib3pyOEN6c3l3TXVMRm5VSnMiLCJ5IjoiMVcxVlR5QUN1UHpVNEE2aHBGSWVfckFwTXRud3dlaENqV3NkT3pIc2pHcyJ9fQ..q2Xcim7sRaCYv3VA.ILG_WmGqKC2KtqzfRcHxkVxYq8kAgewY2gWAZN-AbRQleTvwjOwGPeBX6ZqWF6KnJJKsdoD3-csF6Jl4KlkVHn0yRyUBpgpk9n2gqgVj2stMFmI0ypqxqk6nQZHCtclh_jRAp5m04-6s_UyuDUJw3sbG3pbqYTWYKbG1AtJOthxuv_RcwNlGSihuPJe9xY56CKuiSTSZkfQsiP8q46FWBVH7lNN8zT6mn7NGDBo6E2bgpAimfGKZBbB_1I2Tb_onuuBkJ1J6qIBRMZYb6sTC6KdwWdXltLiQawndLKKzHbvYVYifjuXRCKOeYfTK1LVexLQtXbnk_3N-aI6FNzBTl1Ec3geupHRRQro965Z1SxMaqKzaJcnEkEHzBcu0PoA0EfVM3eXA3pUtXffn2U_mkvYeiYdgQRDh2wqL1HiwX-W_BBmv28ZX9ZQWK8_F_0ieHQw02zKRNyR5sxc-u8qxcJB7tPGipT2ENAO-smSZYOnLFcRu8gUxxYUBcO9Vmsvq0uwuHXjT3rXfJtlE9wrHGOhQnOoYs6q2BclV7JxW9fPG51mN6AktyhGKMO_zynN83jNP9D3v_kuBLrGt4FmpMBYe2bRPRGbIXH4SWVTeVQw4qEzJ1W-EvaqE42vP8ekLlDlRLSuJpOwDNB6toZ9mRGUMFN0jFmMstE47Ywmd-oPLKQXXV03trzMDXC1_JifpFfWVRgYKWYORfYFEfxEwOjk0MUaROiliyzT8abhxbl-_t57JQ3GLibs5y1Tou8kvhivnjQhzhjuIdvwEXwvM0vYvBOpuhJvZ3zp2FXea7BPGqgW_gnYKdIRAFzCsc4gsUtZW92htsXOfLLjyaxY5k96Wr2Tz2NJVZ3G-mpvd1P8C8DZCFMzfAi4eYtjW2Tjdf2GnqONybRLtK9OP1dgVc4GZ2gzWLHgAc9n4a4KkrJbc4nAAOwlGLt6CUMl8l9UU50dL3asAAxrHY6UMfeR-Doucklr-FAh8zbl2LmXeR2vyl755KnjLp2RgKO-lGndnap_lAVQUl3Bbg49eGTWp4s34Xwz9U9iLlhJQikKII-v3UdqxXpbJHzKZRXznzdTQ8ve1Pjg7RcP5C_fRoTqA8XxCDGoT5AvKgz2Y3sU0ED3I_Omb_jHgGRxD2ok3mculM7dJm-DBvX2TKlx6civdqW3hK0r0nmam9AJZCWI7trzDvUTFBE1EpE4Knoa7aoQR0w1KWxTLi1Y-Wp6mMrYN2PRwaCRemnJGyq2hW7nZDJRxfoKHVfBdnkMcpTvf7P2tKa0iX8mV7guh9hg43oTw435nsB5q3czYe2Xo6oCbLjktHp7vIsOhow2qurlRwRtwkrygTmaTFwCfjzUXrFEF221n0qa8u3g1G0NqQ4irPkW2g3r2vVZjz0x_1cxMU3RN1H0-0PnlyuJQnJjeh8exEVgEisOiI-m6EJiYNTq88VoVk4cag6JCexEfIxWb8r0GcxvlKQNp28UIATfbDZroUQoJI_OLEae8PGXfZOLknsz1oY_hfkNSonWCrFW3QySPs_qGubUZSXmFTbKGtAoIY3PNFWe6vT9ixyEXf3YPIP4QUh4Um7OEWnq0YaT-oTfvfUhGgsbgs5EPJGJwx0LXUmAvoasaWZwvSf4EDiBntVHEw-dAp3HXJCXZD1f_KPWjC6BVFuQ6tFtbuvpQsYXd7qukLAX178w2Im4mubQDd0OVlEqbKcUc5MAKZ_kq_9hIyGuPWj2T3uNkXM-IHbC-sEfzxeoTG7-BRrj1Np-lDYc9y68eU7a9Iei-WW0uFdep3_2S5Y859dwmWHwfnY4I0sQQnAMp3M5cHIUkcLzBJK6dlBlaprM5T6Xwcp-6qZfZ-vi1ig5dXEakoQZJZgc_CYpbwnUDS8VS9t4AAVA-6grQlnuNu9tj28WAtyIRsMmPCEQw76OVmiaycer0wN2Kc-mVkH9f-gdN7Ha3EA5xnDg09GEv1IkEqyLpPnFYfw3-NuNMWc-Z6l2TqHT-buQ4ECNm5_k0xyFowXIcYrOBlrzUxingC6ZZ7E88Xp-marVUd3HqkKtqZxN2IVLJWmAnZtWiTWgMff_DBAVQtEw9iITAHFB9RCqoWr641nsxCOIYF8C3ulcFrse-n2L_sDpiIWmueZ4NHdscWqc17l82WM4xPD6yMMhKIBmJA2Dlugmx5Pe6CBAV0Tmo1ms5GyBrEvlqdSRludgyhz25B_TCC7L7THxgy_tpBPf1WaQ9YA1Rc5prwbShs-gKZWZJPSFJJgsPO2sej4FzR-9af99kqTdFf_8gHzyQYqHM3saO-YQgxrGohU9MZd2OPq-FHhFBT8XJEtkV78KOwf-7nKUzlTJX8yGa1A5nUqn5DRNcR6LKSqA-XhgeD-WKfEoBnaH4PaPgpc9W9YTFg1Pr4aLypKA4_x0GUv1COnVrHUsI3TX_hi3_zX0_e1DIziWz__JsF4NYy8JXQV19nnDvRscyVskX-h7qccYS_fL3LrglqtabSN_F6zJovXCUzcXG08IwqKXTa-aazhi9R4LtcXtldmdC5C6-7X7rBo0jeCU-eQ1FTgvRnjwbCWSMCndk6YEVNPPq35zRxaPAJ2UHW3CRk7lyb_LV0v4NiTHZMaGwUbOTAkIrSuSGX8QsjhnnFm_QP7NJmEie9tU_mTXPGzuOw4okrZeB_E8yI1mEpwK42JwQzwMx_ZEyuzfuQWk1Aw0nTHWbFdIMym-AP53X9MH8KWk-rV5J3rYTVt0ulIsFartsR7CM5N6ZieI0ApJF551jndq7ew-9PM-wf1_Jc7IDB11tVK9frZ9yvNQ7p6IPxv6pm1RTtBwYcUyxHVpKidqDhlNSvGY77O2XvLBkd8kix0aWEDeW98vr6Esow-byrCwtb8biYC76SGxIRteKTow2AoxuAdDl99Z26vzYLQVyJGtANPWFvqyBb4xUVfdB1Ffh-TK2pB0yPgY0ubkRbXETFhOJA9rCst-TY5IOTWdmHAFhGzYsKGKFl6nZEi--uHOQaEWec3qJo4NOj0ed8DXA1pnNe-Z_12WH37TaXC8D6oFu_0-s8w6GZdx7X7deSb8rqaCyifyIUN0Vaa8x7ZoN8rPR_hZ1TdV5cluQR3ypfUEfYSPXXjxaYjC0cxsXMB9CkxH3kfBpeLuYKvb6KpTQiHE0z8S8ON-pgQzIIS2rciui8Q9MdWLSalxUXFnjmAyr7-4hUO-2c9e1fcIO1r8rUgWoP5m13GZO6atjiLLCDJLL16f9BA08r7L6_Z3DjJOPJ_lfAXSmNHS6JZnC6uudIVcVzIRS3Q8bLCsi9bOP6zEbPa39lxviD9CoX0MpaDt3W8LURT0Wi1WeV0sAO2tyiqjHEd0zEOopCdojp-SeSy-1c5AWAjbb-0HbNqp0M9zhKoPic-O-PYWs3a7_y7ltW61vOIJnKh1JAlicZN1i6qCpXUPRerDC2GliHj7Gz5hXQP9uK5dJHdouRvucAjq7n06JRKUURIaQyjfvRNdCB6KpRgAqT4-X60KS6-og-2ZCjDukshmDYAuXdnUbqequB6wif9rVvHkUFLSRkDOiUcAqJKNy1SOyG8Rzg7VZKM_3fDgARS223VzqEzxCi0fdej73tQzB9_Uyj4XEd-EyprW_ETVMDbOFDR2C7uENNnR3B2v1I2P6DCPhTP2c6SJgKQJxdzPLpTmgofbCRq8z-Wa6WflPS7iQhKtYGCnCZNpIngJWmsRB9B_JuAC-giZv9iTc2f668NHvqpb-EhZqn1krOHldnT_1O-_pMxcXb0TYPHs7LTuQbup0L3EsBTLW-v8EBe8EA1B2wwwsGRYYo4wYyIplAZIvEZmHhONR178WOhsMa_U4IWf5M6MXU1j32uDRwt8--xFu6r550XnUnRFFBgPLI1Z8iWF3tlaeFOhXirsVyc3phc46iiP3x6bxDcmFb2JYg08LdPsFQehONDuy1h_lhkUpX--jO6v-LHwVWi1FQj59r-n4pB_nIpUxYeJ9PvuAPcbfECsuTAJs8OR-relrWtpdNZBf_HbWTblunemjziwTH2-dQo4QLviq8BsQbKw2AsernrDBtqfc5X9Kwz-mtTZ1iIDp2Z9aFqzg97exkskSxyhq5N2I38ZxOY7a_4DEITkQoIK7pRL9TgsVZ9eICqmab039tEBM0w_yRQQq24Bn1qz7XmPW7qdFnPiX9F1VTVo2M5nagwqafxVyDrzOUaw0Kl7FquG6wkuL3fIKOPyDXBJmRPnqUj5UfNlID9u3UVuAKkQ1WUcq5M9_dgiQWpWZDvShcZWQxFdpw89ILD64BIFIEIdZjbe3JSvMtk2mMIxtypNl9c9drW3KSF-sZs0dN7CzXp1cJtNae2lDREkTTcJHrr1pqDqvM8Ff8EPbRK2ZLD0YwJo4-O4mKwsw-Mua2Zy_ivYmLIuvb6SZyTROqPor5Qw6lQzgnyiL9U9wSCpCRBy1bHCuwppk1GrIqkXasf4KE4L1qeHJUHdWenw8tI4Hy3xOHzxENsYtJnGcSF2WO6vQf__9dQ7WhQlApCBm_1O9BqZpsktuSKfSaJkoRl_ojcmMsJmCg0qoOqYYWJvtw9ZrjTjS9q2LIwEb9irUTWO9BYx0Il1BLC8L_rqa2Ma1rsWrIMlArbrbMpsHtj9Dskx9gsS11zchfY0jCbOGKPilhWMzde6ydTZredvfcZsk99voP9i0A318uSrz4FexhcWkqrjtoP1vcs4QoexoGmlAlrFb6QtTTeMH9uZKU37r0ChQ8WRurACnG5VGoPEZxQi2REF6UwZT7HHcTiivSkF9UqFyDpGgBzOZdlvsQkGqDOj_QlbUBes6kr7ws86_plpilodSM9HVllP7U4PBIWiw1HEOZdEfjTDUZAeOrjH5LAzWb5IpHyJ5_4jZDQPfT4uJhxvqpdiowb2K5BlbNWoZ7ugsPS5xqR--TprWWNfTZtKWXOWtwPsxadeJ5BkmmveWXw-vbXIuinXsFGRsGMXm_Ffeu5jpuwdYtmxm3UOdAXxp6Ng5ybi41o9O_YSANw-JXeBTPjGuj8GRJcpT2iJRj4lSDPIxDd0Fpafz44aEiLtmNGhPzwjt7qQ_1PgggDhoxYl1KBCHkVTIDDhchFdIiTZbi3E9G2nB1Jm_InQ5zVMNxR3CzMeqNpoqRhJ347W3rpRWgwiCmFf2PH8L1A_wy-vgG5cv7jJLHpkpVxb1juxtFkF4MidUFLUuhTDwTiKbRKv86RqhCnI7CsgDY0bK31fi_shJUx4LXKsVX_IsGC5QxpW0wZC_CYEHX2Eheh0EJgcrrQfbClBN2BygZCRh6WeghplVrjm5mTGPfMFnYtBc10Yw-sZKf4A4un5Kl3nS2YJx4CQBltx0I3K_FWpBrfL6511lVmcEW4N90pFHT6HZ9D1bzWqjhmtzJofErb5wPKc-PHQ0VWTxuxr7t4mozqSWpJ99aXDlPi4SUQR_oELPfEWzyraeKFjCYhUAyzeWX5SmTIKqc9xoRMBWZpUYg8fJ-15EG0GPQFKx9QDrP5yFk97rn0ZbPwSNHUW7j2MD9Jo9RYZEBAPGz9y9-rto99QPqLss-3h12mZUyxPcGPGb_pH4pfbgtSDAYFK9PEpICRdxnMVBykh_jPbFUlFMCx2Q4Ll_hpSM41AOeGUJDuxTZB7t6VF2KaF8B3zuZDXffFRRaot4w7PwfL36W8GzOFwe4oogDUmiB789iPpzaDhuv72CRz7K8-uiLzo0dyiMKVRDIdCxbQ2ZGO0pZuJg4ETG8_oLVXHG-XQM9WeeinHuJdAywzev8a_RfwZhNhP9AhY3KnaLJO98e61HSTLRz04fv0NZkfxvZTkmEYuDyygwp3D63_5_5h0644ElH-roY7DXpy3J2begfBUDXO2rO4Rt8NId8KDLCwLqZpRe60x6VASQmDrXXC5_ysF4K73EUGjwupI-gGuQhfMiY5XERnByglJnrPMZIcqih9eEJx1YtTbQXhZ7inDZ7PKAoKGd_BmiJetRj3pkKDIsKAB4TE_Ld1ZyIWc8cEk-Pg9TP0SPp3Uu0ojhMLyP6pwevXYXTJ9gma9RTbFWazRqcC1FHP62VS7AMW58HGGe82i52Dfpjj3T0ZjnZeZikbzvnG3YuuLcb3upNzNYtNIpgRWceTai0HSSZtmThSLoaMwpVOHGYg.aSSXKX2aNPOfBXPVYwwEEA',
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        'vG7bA4d9cwopJfTc91Ts1pu-akuM0iloPkpCDsoLP5ysTiEKozY5U-1R6LWhwtzm3ngzUBMUXwCxBLW2cg_Z7epUubGH379bQTtOlhVtwj7ODzPYiuC-r4k0WlOAJZnhrOVy8En9H8hazDJmV_sXtS5TM49_BVueGBpVQqUWMGz_QVNB7ERXQjnxu6Ws28fhNeetwMv_Cf5eCJB0gC1d6mu3oAQC8IB9A_A94S02cWkbc9hjCfzWmnAA3Z4Y_7EEXu3Olm8EK7gPtf5R8UdHNTIgQRWV8DGCLDp_C6G6lk4cTteK3RH7mRzsdpEU72QrJnQxjbPj9zaAm0jJTyprXJ6qpU2KI_H5gQRZAyU6sxUP7XsywHgAaDIzIxe61KvyFeOhIXiaZekGRJSUc6ReqLAm6VxSBMfa3-w6JBD6vxPgNmYuZjuhoRu4ohdSWCr7Y-kVc7V2wWP_sIgSlFrlJkKFRgLyKqZUS2PVr-PUhyr_eckB77X09JCMKAliRrIYK3PwN1boJNMYhwNM2BnHeKjAKru6yrfuGchLM6p4-lqarPQxXV-VGtY-5pL4ZhkeMH55ONXWdSK14CNlaRDFPl_JcTnf7gPX.mRX_AxxNbuLmwk0b',
      expectedOrigin: 'http://localhost:8000',
      serverAESKeySecret,
    });

    assertEquals(
      verified,
      {
        credential1: {
          claims: {
            family_name: 'Mustermann',
            given_name: 'Erika',
          },
          issuerMeta: {
            expiresOn: new Date('2029-09-01T23:33:20.000Z'),
            issuedAt: new Date('2023-05-02T04:00:00.000Z'),
            validFrom: undefined,
          },
          presentationMeta: {
            verifiedOrigin: 'http://localhost:8000',
            vct: 'urn:eu.europa.ec.eudi:pid:1',
          },
        },
      },
    );

    mockDate.restore();
  });

  it('should return all claims from a mdoc presentation across multiple namespaces', async () => {
    const mockDate = new FakeTime(new Date('2025-04-30T01:03:06.486Z'));

    const data: DCAPIEncryptedResponse = {
      response:
        'eyJhcHUiOiIiLCJhcHYiOiIiLCJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTEyOEdDTSIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6IjBsMFhYbHVBN20zYzVNeFhWWHU3TXhGelQwV2VtVWdqaFgyVmJ4ajZkbVUiLCJ5IjoiUEVEQnpqVWdSX2c1aG1KT0RvNkJUZmU3WW1hMDhoQlR4Y0t1ZDg3eUUxMCJ9fQ..PWKBVhQ1tbHyToL4.Teg-t8RwQd67cYech3vKmxDRYkeGeXL8t0FnTjJtYlc7IT4dj3uclkEXtYGWfM5himgchqPB23D5liR3b9sQF00j9vFts7vUecKW-0yPaF7OaaZwqnj5bQAeEs5pT9AA01VbB39nFSzD5A6eVBH9v8TLb7ZJfmFm67VQp1pALRd-khHhxnKB8mpgnXCH9-NsB108NFvIei1b1qRauXTrceekaBIPAFaRLR5kWqw35mXVXHTQMWK0Oeoc1AiSTozdtvQ4tK1XZRUQqxtnxH3AS7hsJa8Jexadkip6w9NFNSW51_Prbbwprc3ffoZYpd7j7yAiHvrLiNM52jk98xyCEMjCCVG1RFpHZliNf-AwE5HaTTD_Y_-RoHCL5-AWefxRQEXieT2tGrE2W7TuUuPuQ_qCizU4RYUT8cyFGLqWtQzFMVWEWzEJeEcgQMcbxpjAnY7qK7a0KhjBDx3PaInZvlPy2CU2VIGE_RiXmIQ6H7J9ML-ED0jJyYhX9_Dl1TNw_lYK1aXuKH2ahH_zQOeEyGc0jAQV3oJRdbm1nzyGKX6rEBTBM79OyEOJlmcHXamrvb8H4ja0ees59fw0RsBAsuSAyLtxMlZIMr36NPGu1aKzXfhMQ7WEVAx5svZQFbDTXIqFeWD_vZvRuse1iLdBeUFuNxhNmh8ECyO0U2gJrEZEqtnfjWplYoWq4N3yjnUeCm04uNlQGvzl8ArueKxtfkbtZnMON_jOGdJSDoBkNl462U7nKr-ZKHy6EafiW0YCzmHaF9DrlySS4P1iSqTZsg9KASPo4csrBi9_wjaMkJUuei7_Vg-Q1QVelArF5iN9tqNyD3rlXGpuOjh0smf2lWc7tIbeJhkqIauaQrzuqVyt3UBFd12guctZeRAcVmhHzMiT9oXMUNSpFy9zWUXykv-4iYgBZhW3LKeX4AOhKuvEGWAUC0Ol-upDFeJEDLLyDt_EpghZjIgHOSw8xCQrTAgAgZEc1__IHH65t4h1J_yiCzCU8KIsvE9Lkwo2kDT_bb2OtuwbrWv2GtOgcQbZSAiALVj6904aaHQzq8rO0er0dx1ZNoGNOM_YFceY2ML5oQ33EDOxHRQ_izXJHibPsKqskEj1KhSRFUyrghVE0ld_6YtZ1LQ8f7aQKLESKObrYIg96aBW6FaTCEp4Zwg1mWsC5fGtPBx0LZTNyhQZAdyS3EhuE6tC1LxCIm8fkOH_wqfDxGxUQjGLVH9GD-Sb4IYDhT5wq7kCnzSQeI6YDgl4Vyw4Kp3_z7_RSOPi8j6Z7L3rpUNGBjjO3OejOolgvtPIhVTKgAJUtVNUtJklN_YJiG_0MCiAGXngyTtrA_1hKo5OK88riUO2HxbSFCPW75QxqX8YOYbR8vuwKdOBUF-H47pB58twsFuiabXTuKEtQniFQM7t-1gMcf3JZoUK7QKZxS_L_Z63QT6tpvRqA6i5SCo905hxXSKNLXpNh_9Xb5I0mIWjJX-rJd_y04_nCDHLxmD9qqI7OM2kXmQ9mGLEJAyrgee04T7ivUyZB6P6wv0HVJGAx5-QAUw8BTdKjrfethvRyABfHjA8Gg-qZWZt-Ezc1TqyNY57OH8pOt7CNybPo7EnqbsPHT0bm7a1BxNWIVMFLz-8jl1-kAeLcIsGQSvYMOCUs-UOhX7rZWSZKJBAfrZ3kSWDFuhsroNJKHxIc_C5mI5UB9didlYAzXzOuK7H-XDekFvheRfDBqpNY0jyIoF-vZTCCZmjZs7iJU49uu_3qwz7tYR3lKcOZo4sxl3GzxQ5t2SItScID7TJidlQhpBkoLlwC6dLS8HTko4F_u4hs-JTA7LJDLe3q0cxA3gprddLL8EnGjmqz-Ejyp2E8sOrxcyFiFxv67qf-8VmqMD2XxKRlfOi3_6tMajBRNgOxp_0ZCFq179ZQ2ZFgDpVrOKNy52lNWVBQco7T_HAvlpymK-MMv6KBehbD6JUb1Eu4EzWqUeAV-89k98fc9mj2AlO03qws0GC1EYvnabiKKwqmpmSKrsWa-XdiOD6R8O5OCoCfFGE5-bLYDeIP0XLhJFTLt7w8FAg-hroGgjaWEBwjK0-7dX5ZLGYlNJhUcTy_u-iyeufpYFRRjD2luHb7a-xOBaYeMpVKfW9k8k6H8FdH-5m8ffNiYXjlGKJeP6oPzHtXEiLuwKOBYe6lVpl2OfwhluiHemb-MiUu9HRKREEvTbnwkMYihy9NOPXCQlrW8un7FXWWyGD8TtbywNJ42r9moYMfarzGmSj3H6nHGQArN8BFnZY2nFnxBOKJ9zm66haqoc14yJDES-WAqJhAjrRcBK9iy_uQuGHVL_MrepELTCLFfh7PAr8HJeQskHwCs53B5Zfm5YAwE2blvrpV2f0hdlGDAbr5Pj-rDI0KQUUwJiK1o43shdHgQTMZ1boy2AdE82C6mrsRQTuN8wKb7o0GJCWfEENbxI0TkMEBdlE_FYySeKWkKOQqgd-wD36m8bnJne8k_iZ7dm_VCpuQLQAY0rcmEjG4H8mp0ZLyiSXXhnzEXdR6EPPO7TYbx8o07Jo3lSCkE5zF85R9qTyToWrh-SN3TxPxxBfUeYdGrpkbIWaPfg5JIW_pI2rWmlFrOrXk58NjYsB1A-8LN3mHKtYGfuToOityyUdEfUWKODlLmeVyHJ7QhSdrXPYA8hrSk14OFsGtJaiydd_-cmjbt-La7Fj-6_gQBOSklahzmEAsVlswMCheBn6Hh5ko0LCD3gmpeZMpRugIzAuoAQJZiv07IrYA5M0-bcitDzXmw5FNaJpYJbz9Hb7MrZkxdVakIIyPI4x2R4-rYPiq64CsPucwGA_6PiwWPViRhkQGxYKTJ76qHzyq7Jb7xhjvIvGyYCKGy46x-ZiUXH-pmPb8JisM91iSY5k94UFtjc7C8hABg0KSi1rARRhCm1ZZLxwcQkT-Maf9JaaEoKnLfgKfiHmzFY5GvpZIpxQFnVMfcybSJiGzy0U-95j0jtCaMHECKyUcvvwNHz4MOn9f3lRERDx7jUNPQu18N_ln0T9F2TPy21u-BPV2JA3-dc7K_iaII5VebMb0W7U3_OW_x6Ch2hzOEJ4MRFynlTzb5oaPyJHiejC9bGssY4B1K5vnxUR3pls4DSD-vdjGwx7FG8DZLzUOgmlYml9B_LhO16oJ-9UI7B934aPsjDTno6JBwOpevcMsBsWJV2l_szlsNJtGgdWnJITI7bcLGjYqPkn_7O4ExJ_Vao7Wyr2WVF0BXISQ_egRWxGTNKR-NX6xGhMrgJqVbSYeJwk3VCJFxVdVJQVH4wNp4lyeM-AYGh42R6xz2HR4Bn0d-17PZw9U5Dm5BZfPPnRDYuQXmyjdSwVwSUaUASeiYs4Y7mno11isZUBK_Rr8G3Eyk1KRZz9MhAjyDeizfYQ7QDe4GwXwR_AeWV7w3BhQXp5EA0im_CEVLsei3oDhh07Fm73LQG9P9m-cpNBvPcF6oXefOY0cuW34yqNrsazqDgbBLDMBQ9f8QT0uK1whFBu14aiChKY3sjWBtuodR1aSOmd99KWIWOYzH-aNTwME3DnOTae_S4yDEYjCwP20_G7SJNKvNfnGMnSOsRNofbbv_1XX2H7qJz_s_JkDGBw0lTpPySwAnhfVjimvtYbLR0H2UV2T_KCc2bQ_PiFsGWtmCgsVcLsXNfZ4M9tZcolUdXsq_S6w7XpGMn_01uFHYVO5dQ6D22ZEEN1CGBNak5NGOiKb2a-FsQCDevd9DGzjb1fCX70mqoxKO7CoNH5CDpzSJre4sWeNOHCkT99mKcqB2tSt3vrewckceEpryq84HZndiaGRCKReakDRsTPVGv6AVjhS_09HtcGeGdj2Ib12MCse75XHzl-JTSH3quCJ3qwWSISdepJXQUUgtr2utNMbkox_VDVkEzLytB0SPZqP8v0k5H-yBSKq5xIWKg.2EsHI_7oBN7jxZbrJbuZaA',
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        'gTP1AuMDaydm1ork6ExLG5NJmxhtPKHnm5MuuulOklVFcKeSTtd39LqQOCGCq9iJxplhHpuXHBuJdTmT25qFgziH-t1bChj6Mxayb1y_8Km-kFMRHUqMlU-a8WRTOEIFKaxfOCyul9WLDB16bl1s-VyaXIFnck1_hL2TFZOHPXs_bu4mBnke_p8MhG_vfD8Wz_9yyv6O4uMdOhefXPChqCFHOCWLcbpv2JLGV8MrqzQXFX224i3aWiIhps58quUAxqeLwuBwqF9Vl3FB6AsJONEEHJ7D4bL4ASzVrdbSI16mJk7-ILBBnXwbjkrgj7PbHzbp2qPSvT6nFwKJ3ED7t7uYNoVYWJpWf6sxiDCEhdVfFdEZ8mWo9CdP9OE3sCeHT7FcOgiXCFuH2DDSQMdT-ggURIyAqLBWSXAqaLfCh-uXgrQ2_IptG9p4dFolmBIB_xq8jgnQLPnqF19ELUbi48CGI4hvVKdgYKeoh1Afwlz4120DJfBhPW9tgW7G8p3ishqQyhj8Z2uwI1hZZkvuftdm-knJ9tmsAYUnENdc1ZO2uBm9DOGjeFHW8D3GCojVNsmT0rWTBPTZY5U6T6UEBwu9J5buwb8K.8GMEGUrrWCXMpVJp',
      expectedOrigin: 'http://localhost:8000',
      serverAESKeySecret,
    });

    assertExists(verified.credential1);
    assertEquals(verified.credential1.claims.issue_date, '2022-01-01');
    assertEquals(verified.credential1.claims.issuing_authority_unicode, 'DC.dev');
    assertEquals(verified.credential1.claims.vehicle_holder, '94043');
    assertEquals(verified.credential1.claims.registration_number, '1941000043');

    mockDate.restore();
  });

  it('should support multiple possible origins', async () => {
    const mockDate = new FakeTime(new Date('2025-04-30T01:03:06.486Z'));

    const data: DCAPIResponse = {
      vp_token: {
        credential1:
          'o2d2ZXJzaW9uYzEuMGlkb2N1bWVudHOBo2dkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGxpc3N1ZXJTaWduZWSiam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xgtgYWFSkaGRpZ2VzdElEAGZyYW5kb21Q-nu1-cjVol-l0SF4YMnOY3FlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZWxlbGVtZW50VmFsdWVlU21pdGjYGFhRpGhkaWdlc3RJRAFmcmFuZG9tUIlWHNIsMqspm9in4-l-ljtxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZWxlbGVtZW50VmFsdWVjSm9uamlzc3VlckF1dGiEQ6EBJqEYIVkCxDCCAsAwggJnoAMCAQICFB5_GzKtTzTv5LDMB7ew4zOnCxhNMAoGCCqGSM49BAMCMHkxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1Nb3VudGFpbiBWaWV3MRwwGgYDVQQKDBNEaWdpdGFsIENyZWRlbnRpYWxzMR8wHQYDVQQDDBZkaWdpdGFsY3JlZGVudGlhbHMuZGV2MB4XDTI1MDIxOTIzMzAxOFoXDTI2MDIxOTIzMzAxOFoweTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcxHDAaBgNVBAoME0RpZ2l0YWwgQ3JlZGVudGlhbHMxHzAdBgNVBAMMFmRpZ2l0YWxjcmVkZW50aWFscy5kZXYwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATreTYr4tfzl8NQBH2D4eNiLONVazYPamjHWLsN3Gr4bAmvml1dDZk5dhLDWieRlpjKAA_IpMABbM2ISHjYBeNpo4HMMIHJMB8GA1UdIwQYMBaAFKJP9InZfEbobqOG2UdIzsy-3M_1MB0GA1UdDgQWBBTf_mpaEunAYsS8mKcl0tlw93pgKDA0BgNVHR8ELTArMCmgJ6AlhiNodHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2L2NybDAqBgNVHRIEIzAhhh9odHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2MA4GA1UdDwEB_wQEAwIHgDAVBgNVHSUBAf8ECzAJBgcogYxdBQECMAoGCCqGSM49BAMCA0cAMEQCIGHFy_V8weN78uCxM9ofIDEEXXCbWiEUDnpoMJvLB0LnAiBwr6LhxJv7p4wVzAnlGe0Ef8pqYxshyE8NufwfR_ULAlkDGNgYWQMTpmd2ZXJzaW9uYzEuMG9kaWdlc3RBbGdvcml0aG1nU0hBLTI1Nmdkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGx2YWx1ZURpZ2VzdHOhcW9yZy5pc28uMTgwMTMuNS4xrQBYIDwZTozduEQhUpy4NmBJPpHR8vLiDVj1LOKrM9KxYmapAVggVQ6itAowLqQ6asA5heFxSGnNGHTy_VWZZzh0riCmXRsCWCCSN4rRJHbIHO1LEaFf2V9G3wncsc1_LVO6GmKRYYtqmwNYINP9RKCFpkNwDoB7DyNr-0-f8lo_YU3MXmWCw5fDaitoBFggnc71_E9RUUGxr2w1sv-KsEfjlr6BePZX9bQMCx7uEMsFWCAZ7pb2eLka54Si9OrrVAqJBE1FXixa_XO7J24WPy9GqwZYIIrFENBlJqwVnfjZ2QzTKA682Bkz49Dw1sB4b9j7WsYLB1ggV5jBXKNDUp2NCM9zS1Q2ht2oIlUIloJXGRhyZxukcbQIWCDBMCw3PR_n6lJLM9QHefTodB_oJ91dnJSnIS0EaUncjQlYIPtpSYaHmnC77O4y96KEb0ZqyJaERqEOByngmajsSCrOClggdcv5N_Ht0EKB_mrFvf9j6CpFUu1wsLxAVjiibfI91HwLWCDtzI8FYsUI9DWEULAlkiP0er-wc-WLCCggAXGQIvjhPgxYIICST4t-3X2cGav2hrv9kzwzpXq1L2GhOtxi_0TLXe2VbWRldmljZUtleUluZm-haWRldmljZUtleaQBAiABIVggIC8R0JuWtANCVsl6gFn7vGGgfsSwdOLZ8hgxKsUfxTQiWCCBPAkV1Kx81rm50sYU-Z5EGZtXe7YQ_Kzrqu2_-h7fD2x2YWxpZGl0eUluZm-jZnNpZ25lZMB4GzIwMjUtMDQtMzBUMDE6MDM6MDYuNDg2Mzk3Wml2YWxpZEZyb23AeBsyMDI1LTA0LTMwVDAxOjAzOjA2LjQ4NjQwNVpqdmFsaWRVbnRpbMB4GzIwMzUtMDQtMThUMDE6MDM6MDYuNDg2NDA2WlhAJnE23CRnkCk6pcqUYdnOr5KEQ1WRE9mGb4uv43h5ofRD0VLmIhleXLxZciRP5Uhc2AgeRJxO_DMxk9YKwRq7xmxkZXZpY2VTaWduZWSiam5hbWVTcGFjZXPYGEGgamRldmljZUF1dGihb2RldmljZVNpZ25hdHVyZYRDoQEmoPZYQJ_2d-gTjPHq0oFNCW2k4p7gdEw3pDWY2Mn6oI4YhUw1sEOC0S8s2-J1ebYRInVqQpp61y8r38eWVcBxPzV-utBmc3RhdHVzAA',
      },
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        'zwTIY_Z3DoYeGXLiBQjiAzssv6EwxPeyd57FkukXw3fiJiW4Kgyeu8F_ncgfi_cSs_M1KOdLyds.HowPGAnoDZg7cr6k',
      expectedOrigin: [
        'http://localhost:12345',
        'http://localhost:8000', // This is the the real origin
      ],
      serverAESKeySecret,
    });

    // Just make sure we get a successful verification
    assertExists(verified.credential1);

    mockDate.restore();
  });
});
