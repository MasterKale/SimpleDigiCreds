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
    const mockDate = new FakeTime(new Date('2025-04-28T17:40:48.169Z'));

    const data: DCAPIResponse = {
      vp_token: {
        credential1:
          'o2d2ZXJzaW9uYzEuMGlkb2N1bWVudHOBo2dkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGxpc3N1ZXJTaWduZWSiam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xgtgYWFSkaGRpZ2VzdElEAGZyYW5kb21QowIG7A9ukVpUbf4JQk38jXFlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZWxlbGVtZW50VmFsdWVlU21pdGjYGFhRpGhkaWdlc3RJRAFmcmFuZG9tUMzj8HaMUvdAFMAHJ6Zt25dxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZWxlbGVtZW50VmFsdWVjSm9uamlzc3VlckF1dGiEQ6EBJqEYIVkCxDCCAsAwggJnoAMCAQICFB5_GzKtTzTv5LDMB7ew4zOnCxhNMAoGCCqGSM49BAMCMHkxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1Nb3VudGFpbiBWaWV3MRwwGgYDVQQKDBNEaWdpdGFsIENyZWRlbnRpYWxzMR8wHQYDVQQDDBZkaWdpdGFsY3JlZGVudGlhbHMuZGV2MB4XDTI1MDIxOTIzMzAxOFoXDTI2MDIxOTIzMzAxOFoweTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcxHDAaBgNVBAoME0RpZ2l0YWwgQ3JlZGVudGlhbHMxHzAdBgNVBAMMFmRpZ2l0YWxjcmVkZW50aWFscy5kZXYwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATreTYr4tfzl8NQBH2D4eNiLONVazYPamjHWLsN3Gr4bAmvml1dDZk5dhLDWieRlpjKAA_IpMABbM2ISHjYBeNpo4HMMIHJMB8GA1UdIwQYMBaAFKJP9InZfEbobqOG2UdIzsy-3M_1MB0GA1UdDgQWBBTf_mpaEunAYsS8mKcl0tlw93pgKDA0BgNVHR8ELTArMCmgJ6AlhiNodHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2L2NybDAqBgNVHRIEIzAhhh9odHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2MA4GA1UdDwEB_wQEAwIHgDAVBgNVHSUBAf8ECzAJBgcogYxdBQECMAoGCCqGSM49BAMCA0cAMEQCIGHFy_V8weN78uCxM9ofIDEEXXCbWiEUDnpoMJvLB0LnAiBwr6LhxJv7p4wVzAnlGe0Ef8pqYxshyE8NufwfR_ULAlkDGNgYWQMTpmd2ZXJzaW9uYzEuMG9kaWdlc3RBbGdvcml0aG1nU0hBLTI1Nmdkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGx2YWx1ZURpZ2VzdHOhcW9yZy5pc28uMTgwMTMuNS4xrQBYILu5ibuAB7xz5TA1J31YS01Xph8CumuHvUxOqUE2OWFYAVggngwRC6EI2bOTa1TzvxVJ5ys-U0j8VBRm8w-zrtXO3dcCWCBZ8yZz3BnCJn0jfmIOydxtjwO73p5Dc8QrLVn04TWG3wNYIHbP3TYRZJ5w-oeuZhZ3MKrz0pQnasQkLTb306vTSfUaBFggCf63J-jnaQZV8TrJf7YCGQ2nZMDlfQTtr5RPM_x41b8FWCDblQsn_BzRcKkQiwjSGPXJfoojodcpPuKRC3utWNr45wZYIBmWZrBiD9Ahthc9j3I4H-zI59KynwHv3yK0dm-6A9SyB1ggJF0BWaxZ_m4nRi0BRbxMy42vWRcf5ur0HAsMsMqri6QIWCDJXpnYbOM6E8ZhjMmZfDgCD0kKNZNpWOGLH7ZPJCKMQglYIJOeWL6r0JFM5FHTzCou0hwyJP-bRLF-ucX8UWGgeToyClggs73eUbe8mXiDQpbfRfC8DtqAei-Q4ldxC0MNlIQvqKwLWCCAk4CaAwhSdmmmEUe92Rcl_onUT-ZWaxWALsPaPuJA8QxYIJX224tD_I90r-C3KpKQ9x9SyRDIQkBirWqxRnd8nmdWbWRldmljZUtleUluZm-haWRldmljZUtleaQBAiABIVggA30hYr0LwfvJH3s5RYJfVABWIkhpSae19vLndlHPU5giWCD4VPuW7U309tOp4vpwwAnOa-HovUUJWJi4axkRUjLTEGx2YWxpZGl0eUluZm-jZnNpZ25lZMB4GzIwMjUtMDQtMjVUMDY6NDU6MTEuOTY1MDAyWml2YWxpZEZyb23AeBsyMDI1LTA0LTI1VDA2OjQ1OjExLjk2NTAwOVpqdmFsaWRVbnRpbMB4GzIwMzUtMDQtMTNUMDY6NDU6MTEuOTY1MDEwWlhAswX7ivVe2SaCVPRrdMe2ZWISwkBFVSYepiRofVsBGtTlLGL26iAD8R2RfWoLxbYmNe9xCXgTDGFsFsmfX6xgn2xkZXZpY2VTaWduZWSiam5hbWVTcGFjZXPYGEGgamRldmljZUF1dGihb2RldmljZVNpZ25hdHVyZYRDoQEmoPZYQDboP-ZEpwAoG8mkXGCSXVE2-a2oGIaZh1Im6sM-b-KPLVzVDYHK6I9eVNv5aq6JxgRHgXStkz4Grko0I-Yu-eNmc3RhdHVzAA',
      },
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        'nBWacHSjO-2HFazXmC4Kej2ftuZL3jvWvJrqne9qnILBJGjkgcTwOrZ2DW8WXL7-deoOYcBB0pw.bHHdOd5C7ug5uBMk',
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
            expiresOn: new Date('2035-04-13T06:45:11.965Z'),
            issuedAt: new Date('2025-04-25T06:45:11.965Z'),
            validFrom: new Date('2025-04-25T06:45:11.965Z'),
          },
          credentialMeta: { verifiedOrigin: 'http://localhost:8000' },
        },
      },
    );

    mockDate.restore();
  });

  it('should verify a well-formed unencrypted SD-JWT presentation', async () => {
    const mockDate = new FakeTime(new Date('2025-04-28T20:50:28.356Z'));

    const data: DCAPIResponse = {
      vp_token: {
        credential1:
          'eyJhbGciOiAiRVMyNTYiLCAidHlwIjogImRjK3NkLWp3dCIsICJ4NWMiOiBbIk1JSUM1VENDQW91Z0F3SUJBZ0lVQ1N6YzBVSWQ2Q0lISS9jYkluMUpzaWtQa1Mwd0NnWUlLb1pJemowRUF3SXdlVEVMTUFrR0ExVUVCaE1DVlZNeEV6QVJCZ05WQkFnTUNrTmhiR2xtYjNKdWFXRXhGakFVQmdOVkJBY01EVTF2ZFc1MFlXbHVJRlpwWlhjeEhEQWFCZ05WQkFvTUUwUnBaMmwwWVd3Z1EzSmxaR1Z1ZEdsaGJITXhIekFkQmdOVkJBTU1GbVJwWjJsMFlXeGpjbVZrWlc1MGFXRnNjeTVrWlhZd0hoY05NalV3TkRBME1UY3hPVFV6V2hjTk1qWXdOREEwTVRjeE9UVXpXakI1TVFzd0NRWURWUVFHRXdKVlV6RVRNQkVHQTFVRUNBd0tRMkZzYVdadmNtNXBZVEVXTUJRR0ExVUVCd3dOVFc5MWJuUmhhVzRnVm1sbGR6RWNNQm9HQTFVRUNnd1RSR2xuYVhSaGJDQkRjbVZrWlc1MGFXRnNjekVmTUIwR0ExVUVBd3dXWkdsbmFYUmhiR055WldSbGJuUnBZV3h6TG1SbGRqQlpNQk1HQnlxR1NNNDlBZ0VHQ0NxR1NNNDlBd0VIQTBJQUJKSmVnOVUxQUdtc05EOWNDOTY3c2kvdmU4WUNZanhiWlN5MWY2RWc3QWRpbmlQaDV4SVRiT1I2eGtDdW5xZy8xMUpPK0xtdkxLTU5BVmdOSWdFbFFZeWpnZkF3Z2Uwd0h3WURWUjBqQkJnd0ZvQVU4VmYza1hTMUU5WWV6eThhMHZyRFFuejVEeTR3SFFZRFZSME9CQllFRkNjYlk0WXlkNjNpc1Y1K2xHR3phTnFxbWJlY01DSUdBMVVkRVFRYk1CbUNGMlJwWjJsMFlXd3RZM0psWkdWdWRHbGhiSE11WkdWMk1EUUdBMVVkSHdRdE1Dc3dLYUFub0NXR0kyaDBkSEJ6T2k4dlpHbG5hWFJoYkMxamNtVmtaVzUwYVdGc2N5NWtaWFl2WTNKc01Db0dBMVVkRWdRak1DR0dIMmgwZEhCek9pOHZaR2xuYVhSaGJDMWpjbVZrWlc1MGFXRnNjeTVrWlhZd0RnWURWUjBQQVFIL0JBUURBZ2VBTUJVR0ExVWRKUUVCL3dRTE1Ba0dCeWlCakYwRkFRSXdDZ1lJS29aSXpqMEVBd0lEU0FBd1JRSWhBUFRFN2o2SENCNXZGUXIwbzhFdVViS3RBY0oxMTFNNTR0eHZxVGtnbDAyWUFpQjd3UUlnMkR4ckhzaHJVUGllQzFwRTVOWDNtZHB3eUI3QlB0Z1JCaGRBcXc9PSIsICJNSUlDdHpDQ0FsMmdBd0lCQWdJVUphOWJHREF3bStpampDcHZkNEFwWGE0QTNUWXdDZ1lJS29aSXpqMEVBd0l3ZVRFTE1Ba0dBMVVFQmhNQ1ZWTXhFekFSQmdOVkJBZ01Da05oYkdsbWIzSnVhV0V4RmpBVUJnTlZCQWNNRFUxdmRXNTBZV2x1SUZacFpYY3hIREFhQmdOVkJBb01FMFJwWjJsMFlXd2dRM0psWkdWdWRHbGhiSE14SHpBZEJnTlZCQU1NRm1ScFoybDBZV3hqY21Wa1pXNTBhV0ZzY3k1a1pYWXdIaGNOTWpVd05EQTBNVGN4T1RVeldoY05NelV3TXpJek1UY3hPVFV6V2pCNU1Rc3dDUVlEVlFRR0V3SlZVekVUTUJFR0ExVUVDQXdLUTJGc2FXWnZjbTVwWVRFV01CUUdBMVVFQnd3TlRXOTFiblJoYVc0Z1ZtbGxkekVjTUJvR0ExVUVDZ3dUUkdsbmFYUmhiQ0JEY21Wa1pXNTBhV0ZzY3pFZk1CMEdBMVVFQXd3V1pHbG5hWFJoYkdOeVpXUmxiblJwWVd4ekxtUmxkakJaTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEEwSUFCSWlHclNyWHBHeFEyZzJxSGUwSmU5L01qQnNHeXlJUXlUcVFqdFlXN1ppc3JyMXBPY2pqQnAweGRlZS94RmZKSyswTTNUZGJWQjJrbVhiM0hZc0V3NWlqZ2NJd2diOHdJZ1lEVlIwUkJCc3dHWUlYWkdsbmFYUmhiQzFqY21Wa1pXNTBhV0ZzY3k1a1pYWXdIUVlEVlIwT0JCWUVGUEZYOTVGMHRSUFdIczh2R3RMNncwSjgrUTh1TUI4R0ExVWRJd1FZTUJhQUZQRlg5NUYwdFJQV0hzOHZHdEw2dzBKOCtROHVNQklHQTFVZEV3RUIvd1FJTUFZQkFmOENBUUF3RGdZRFZSMFBBUUgvQkFRREFnRUdNQ29HQTFVZEVnUWpNQ0dHSDJoMGRIQnpPaTh2WkdsbmFYUmhiQzFqY21Wa1pXNTBhV0ZzY3k1a1pYWXdDUVlEVlIwZkJBSXdBREFLQmdncWhrak9QUVFEQWdOSUFEQkZBaUJPeHpiMlUrVThHRkY4YStHNngrd2k4Y2oxTkRFTjZlV0RQQTkzWTBRNjJ3SWhBUGpabHBVWmQzVC9FVFQrcnZGd2NIb3VSOEdkVFJoQ2FvL0VLNXRwNXV3dSJdfQ.eyJfc2QiOiBbIi1MaHlCOGxWNHVXdVpFQmdpR3BXUF9oZkZURTBWR2hSMFlnUUh4RFUxVTAiLCAiR3NEaENEaWxWb0pCcHEyUGxQMkVvRE1SX2w5ZVRGNXZxTnFjRUdjYmgxVSIsICJOZ1d0VmVxeTIwU3VGZm00Y185dmNuNTRIV2tkVy1veXVoU2t2c1pHZ1pBIl0sICJpc3MiOiAiaHR0cHM6Ly9kaWdpdGFsLWNyZWRlbnRpYWxzLmRldiIsICJpYXQiOiAxNjgzMDAwMDAwLCAiZXhwIjogMTg4MzAwMDAwMCwgInZjdCI6ICJ1cm46ZXUuZXVyb3BhLmVjLmV1ZGk6cGlkOjEiLCAiX3NkX2FsZyI6ICJzaGEtMjU2IiwgImNuZiI6IHsiandrIjogeyJrdHkiOiAiRUMiLCAiY3J2IjogIlAtMjU2IiwgIngiOiAiNWtjMWFJN2FiZVpsRmxxNmliZGxMWWRvY29tZTZva1ZBRWxOSi1uUkRVMCIsICJ5IjogIldLdDZEc1g2Mm83Ym5ZWHl5QTB4a19GRWZOU0hFcXBSZ1FPVmFhYldBdzAifX19.hQIYaxilAWlTFl7JR7RB-v6F1zJ7HCuki3UPS5l7i-fQSyoKyMTMA55UxwYTLWJdQvhl9HGYwPQdYw4SdYRZ4g~WyJpSHd0OVg5WEpxS05CVndUM3J5NlNRIiwgImZhbWlseV9uYW1lIiwgIk11c3Rlcm1hbm4iXQ~WyIwY3d0UTBQakJvaXBhZm1la3ZnVFRnIiwgImdpdmVuX25hbWUiLCAiRXJpa2EiXQ~eyJ0eXAiOiJrYitqd3QiLCJhbGciOiJFUzI1NiJ9.eyJpYXQiOjE3NDU4NzMxOTAsImF1ZCI6IndlYi1vcmlnaW46aHR0cDovL2xvY2FsaG9zdDo4MDAwIiwibm9uY2UiOiIxMnh2V1RlM3Y1REVlM1M3eGlOemNTc2lLbFMtTElsRVFzNzA4Nk5lblliZ09zNmZpajl2THNRRG5WaHZ3ZjFyTXNVV0w0anktYzAudlVrQ1V1aXhFdmZkVEJ5UiIsInNkX2hhc2giOiJMWmhmSFJTWnYyZjBNWnB1RmRjVVp4LVN2TEY3clpCRWJDUENyMy1IUnFnIn0.MJuyJqMSu8EBhaVdSY_hG8uVnGs05cv-Y6pm-nfHqvm-e4MqlctXPk6mSzTSnMyKA1C4HAZ6ZPuD8HAF567kew',
      },
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        '12xvWTe3v5DEe3S7xiNzcSsiKlS-LIlEQs7086NenYbgOs6fij9vLsQDnVhvwf1rMsUWL4jy-c0.vUkCUuixEvfdTByR',
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
          credentialMeta: {
            verifiedOrigin: 'http://localhost:8000',
            vct: 'urn:eu.europa.ec.eudi:pid:1',
          },
        },
      },
    );

    mockDate.restore();
  });

  it('should verify an encrypted SD-JWT presentation', async () => {
    const mockDate = new FakeTime(new Date('2025-04-28T20:51:29.368Z'));

    const data: DCAPIEncryptedResponse = {
      response:
        'eyJhcHUiOiIiLCJhcHYiOiIiLCJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTEyOEdDTSIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6ImVzY2lHR2ZVTGQ4U05JOTM1Tm5qVnhhenQ2YnZCTGxnU0tTNkMyWDlKUTgiLCJ5IjoiQ3pDcGZaRlR6VjRUaHRTTVVSTTIxbDVONk9TUi1wRjJFTVVGZkM2OFNGUSJ9fQ..uG-lEapzoKm-X6WL.RmqzjIzB27OZAIshv2o-O1heJBSHGE0QH_skPXX-gA5meIH6y9wyH9G96Pwj3s0yFe6kOvTAX2NfMyj7uccEE0_7_R1eh3figSnWDaaPCX76UIMOPzxaez9C0yXKAz3pr4Q8u0BgOHzwjBfe8xTRbSdjmd7FZWb5_RKtiXaa0cSe-Xa6mpRf9QfqJbzzn7HEoxs1FcSy1AR-QRp2gIbd_W76D3yccilOKk8atqrQC3KgLDZxim1EtfKXISeytYZncP1bOHcnUf0tCXNEIbxglePskk89_lZUpreSinknqKIlhemzarM8wJi3HaY15-3hI3IVoIGzakron_yYiTtH803fqmLMimvuc8J96ay4wayPVzn06tsEGIe7WM2-ml4vRFKm3tagXvMGPdjZdH0l1OahB4cJRigT07uagqXDhPlw9IgMNE04AxSTRBy5Lj2X9s6ffTelfUPkJZru9BWVAXYVaOopXIJhC1-Uxk3YrBHemJ9qPXcQfE8opJZ81dDjD2Xi2gniXhWP12QWfDDVqfIP3dDW_HLoJzyqfSW5ZFWKCqb96MMv-ndYPpv0U9GDU6QAXnYe9uxA2852K4vsYX8bRdDbwQzHABtZYwkQWUjIqYFrx-57OQihRPWZsH-MbZa14enrVE0Xm3-nFP-pNj3AKt14Wf3VlS2vX_D6xArBumXRNNaLT0fSIhWEYqIVdLJKCTcEHWtARbgK0cTi0s8_FYvhtz2uekuL3A7dw4OVf5jlvBdwUETO8WmukZlZ4rMP1YDDr46WLbsWCIpiRMFULzbf4GMjOc-ocMqubtQjQLIaDmIfNpuJfH8FYLUIOO_jdyKo3GPSww1TE89AHNITODOk_2dMBUJPVVY9kp6OKLk3AVPmaVMEwYIa_nmAWuGfCy3xJQsjGJDl6tDJrQw5TseK3eXrGghJXykntP1lglbOWrWS4OcVV88mQnGuWyWOP6X8Hy_79nm-EdhyD4l1RQoRMosYgg2gTkZ8dS62WfWJwXUBXyd18rO2TZjWf4YFF3AtOWxu9dCmgajZ0G6Q52qt863z4kWRTvFsb8ZooqSP7YYKQCWHdJP2bdnJhClohoKX0mix909uWRjO9N4NXE08Nbu-ts_gbnb3vaBpISC77gaUSAfAozBe9GIW9nibQYtC24vKMrqoFHyIQUH6ECl0P27b4Annf-cdYUOtaNGl12Hht_MfPBgUo6qGJQbGg0YjJ6RaSoPSQzp1W6Zf9juKxPQ00tsKzhaaTGhwsmwdhguNC3gra-lYWRf5GTYQzZgnm2s_jsQgm8xm55_J7u-6A7KAFI2mOebfFy_znj0r8LBrSVyhRHGULLGjk8qoEP_BxSkM929Y0nT3gm5lBPUwpJRo7jlNFEPSy1v_G6QlGHQmtAdrQQAET5OktCHZdJqfb-drUS5yLuBNdDG7MdaNj0-w4munR8hWicdA3QXdvBmT5OnMh-xoTsO7d5Hb_90a4VWY6lYciADGruXbcUrjl2fZHZYEayIj6kt8h2L4nQFl1SD_HpDajVkdkpEcWLSI6BcVsOID_ZWA6VVzAs0plsbJ5EegmR0tnMXLhbpSJ7_XAM6u-PvzvqN7NTAmX9XXtn5kV1PazOoaFrsaMkI8W0lkXM-mzY_3aVD2YGF_kFQlufXa7aJXaR8gzGd55ulXHry_BKEip925-uyvrH4NqP3virkK7VGe9GQyCk-8s5uktldJV0tXyiC8qB5dhDwHmzA-0wm5nZot_q1gmrNGBNtyKsLfYZV1bRW0EYgPUgor25ybJhCdZLCEXvCLnNI5pTJd2u0AI2E7QS_zxw4MYVljmbZiHAeXhtFhTgFdk3RQ8Z8xd_DOjy4zxtYpYNFZAfqNmh15b3s7jpwWa645aHt84zNlKKQkFr222Rf5J9ed6ZKWkO18zkNQvUS7zRwt4GQwBY0wQA9B6Jo-NMhifzu0pUS7xk7EKq0CbNFdrxWn-Z5IIwFYY5xcj7ZJyQZiZDMFLvTncjgPMkOM5EMQWZyAkD0h2o9glMFz64kHKMtJWEcog2e-m3VnC1UYaFUJawpwqtUnUqjIIUgWzF9v8oZUTfLo73vPSgjpccCXB8UU9A7S30HbJ0MDyskRDiqS_Qkix5GsiEeaQGCeHG92_y6-VNjwrmPKceUEcHkVmCY1oc3G9lZSWEIKP4GoiAJs545nhMNiAIQbZ3SGsrSIlH2eYvu5lTI2uoPBTa7IWccHVtilRef41Bh0vMYW6fVqMANFZ1kAO2I0dBg7hg_p4gn2HnGdIWr3TQYYvrnEOvoKqAsJqiUUVTxplVLdfsrbEWdwXGXwvoilTM3cUABldcV_lklvgb5gs6JoxLAmtCm7kLoUs2XhOoUTTn-f-SZhXOI0QCcWG6PWrw1FzWpHGzwzbo-LYqzVxOdmQ8Lp-bTKyqLh6CCwpIKIqXgxkYfsbvDCtNHzOJGmoO5vOjlDzRd8lfH2UgkF15rhGiT_D3Jj1DLwh6CfWVd7wcVufAFmTzwlvs-i5II3qf6LC9DAuW5AtFDFxNJq1dRVU7iwDpoLM2DGZ_S8a7UL_A4FS8JzBX3oUi_vN9gYbomFUk8axK86Un4Cbg4pJUdf9Qg8BOFhflEKVaPyQ5caZzkPPuoec9GpWRSC46dyxrTyFqg5S8ZpnDmt9HdonpNA1Eqs_wAjt8p-9p0vueVuY2osT4paNwR4e8aXr3D_X-DnmmDmH67vQqCl71DWQi490p3L64fmjDJEjNZbeA-e2d_K5scZ-kDYnQKh14W85qfDCSWPUnGghaWkxNkm7bLE91eko42ECttPLryX3eVOFNp6Hm9tN0j9C4NNmrFvLmxc9Ayg3n4tL9Uf-6kA8cOUsEp-KO0xH7mMa3J4qrDdWAJGhQFmL4N3g6JJHk8UUA2IsZU-gw5IrWUrJaFmQ0g0Q2kqqklJVou5sJICBjget5xFNyRUGhLg9fwOgPyUJdgM0gAwvDlTmpWWNs1ViEFBw4PAul1q8C0ccTIJ1RcboVfdeoSPzBe8IkwoNm1OR7m4dMUbekMd0T-n797u4kQEd3BPlNJe1Bmdul_J_288mKkGy2TMsKXtjWjKB8rawQubirG3nvdu1o7jOS9P3GT85a3bmrO_XFeQ3soEkj_2W55YFdRVswDtqtLggKDLJj5rn9SAlAj_2BbQBtSPUPxKxa1VLff8KrDAFfTOmoxEZXeHvim1nqtG6a49g5ioomUJg97IZoaP8yFrs8h0tM430_wz_9DtUTjox1z0T3LbCETj8LHmtxbBTlQQ8uqJga-O-w-RzXPOIPIfb00U_kqExe8r4Zfy5ZLofShG6niaj0S3t9LTktzvtsoqnhBZiR8z-6CSAinAan6WYjUEO_IY0LReEC1Mr6fbm-6C_5vY_uKiV7TUQUz-omGSU0QsvEgZQsj-0y0YupjcsfygcKGSOye7dyLQpvn3pcapdKUdIxPJbxh46xhfdOw5gx3G7IPzYdeWgiji9XGSkmTZs7xWz-RIgW8R-vE1G8bonCjGYwzAbyMTGTxFDzwhbDFr7zQI5zAuoeyxQLf45Kx1SIwwxlM8cmShOrUV5KLOdxUH3o0NitsgTi9zcZqh3zIrWSq_-hJuBCnpHJM85VsaH11c7c8pCO-24_uprDiuIKGZhFvJ_bkDhoIHW8TaKiB3CXuZEMZPQRen4NTN1r1hwXzjoapKF-5TvRVcEF1f6NcOaVf6Mr314N9tpgx5DhRMUtCipbh5j-gBY8MlICMbK0uiwPqqStMycR3cduK9T0z4GtAJf2y2_YQp5QJ7LrfnJIi1g3-_DScawgrv0WGfXngo6d09eyXpxZFvczW-lN0OJWOhwg7cnsyBOy_peAKuKIUAYYT8fAYt5GbHtNFFKyUDCW_pc2vWpWf5UdTI0nGKXEehEke8fKCxx1FKKD9N1XKhrTFL5Xh7A4vtLeJYZ1-kmh1dSeo7PdIsrVKIyW5LZxmOed6mfntmb3hEM_-ivjAtdprcue0bfQFSavrfu8WI6Yhg6APRzx5fNHJJhgiAjt4U0Ch-CRmDiqj_6hRa5X0sj5tg9uxfzf4cC_A6ABOLRrCPUFTPaRIMxo1GUYVkWJO_VF2OnohMSmRPcp7OP-558tJ86sMI9xJM_kBxfPBtFT-o5PEvjEoR-_sMgWfVcnHnAxDDCO4wqjMJDmo7DcAyi84V_8imGSUWhokWZNZO9ZSHyyFdCISb8S2uRHe76gJNBQrY3Ct4nGs7WBpo4K43XfVoJn5aJeiQjqgW0ou23SfWCIZwzff3R3AW0CDA0vnxLELrrVE61M3sgCZACEwVmZromMbzD4iGvNaY3MJso3BoBvESYSfiac-k8XmhUZE17hwnxz_iGnsgBP-M0iOcxLlnDZpk0E3-cbHVGQz_X46uvg-SX9x1FeXOHvKkWYuwfB2aY2hFuWihvttRJHnrnU38vniibtQjPtpmjITOBf2XHYVoBgDAkBilA2jTlR15AseFPPcT4ysnFbkKQKMAs1nXMe_UP8fD-P1t6V7g94WJUfeoKrPQfU-Ju5pLJwqk-dMCcowaidyEQHHnLr9vxWb_SRSDUo5JI1NvvpcppK48Usveirt6cE_jwau75dHV9gExtxWgX1MMMIJJdYLVpQv6zqi_PIYxbVTLF-MX4aTK66Fb8pKw7AnclDnCGozGVY1UptI6EncIOhwmEBVnCSk6-aV6hMPKaDGSY9r6fuVvf7fuZDJFL6MJbMc8-NreMbPhJyUoHkmOeYfe9NkKWHUXkHwI7pwNIrwl2NrlOseRB8Q5Ep0KfK7-UoyU_wlaOgdZF95t_0QwU0jRLRmeiLIYoBgeMTjmHGhPFLwOoIskeB7vjfXbyTJbu1g5JTg_BZdmqId9OKVz4SRDOI2bJIPrHV2XBGMJbn2LX7x393ClC2P4S6ayTIWTXAUSdf3q7-y3hDZUZV75KSMBf16qzjY6lPNrYRI4acfFvwQPXTZRkeYC2V0yOFsgC_3hLPtve8c8zMzLR59CHtH-gQg0p-Vy7eyRvf1xJu-sWBJ0XaIcsHqFj5zpPiJndjyBvn8GQ4B6ESvlvUaGB0b-1ltYCUGUEfGsLAMyKckLP7zCaqST6DCeHjuPIkFqUw5zn9IXamJm6MmxuNrcPQssOMtVKo88-RglXkqYW4kwGlA1srCstBdI171mTdY2Aa-kRnh9WG5UfHJ9Amaffv06730DPQdElsUu5cK-zkMJX95PXmT3Wm8ldYo0CA5n8HIu2EMap6SrUVI5LNG_gsIGhQAIKk4Lt08tcTf9qj2rc27gfUYZVj3NrrV6k3NvRBp0LA6_7XFk2TKgKH7-NWZn-2_IbYhiidHA9aBBOjAPAYXco7q1pgWCh9eff3hqG4wMOUeXtpyG9MHlb8WmQqEPcX2mbn35bOV1C0pNVjiGtAJZ6V4QBNYo18cQNxH-VeZyBMg6jW_xmwM62P1jh0G5kdjc6FXv9mJOAE3l99S3nZeYIVo9eSz6_Jv52ty7_DoFC-Mt7HoVe8QdjrCiCuUqtiWkX6UvHJF8tqtpdxD0xZ36W2Shw50snelBedAPakivv4kYRUdd-yY8k2B_jF9nxH9vRDcJ_mhu-ywpDiadpy97GWUVednEF7BSyLNIYPaCJlENvJADhPCxoVwAgUApKZulZa85CkBn.zl0TcWLp72CBw85mbaN5OQ',
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        'Leh-w7n8RRE7Rkzs0Gf-sOgLq4OZmH7n0tSmw-MvaMtwsj2PKq61-pRZksQuKDnqkBRgCc7huz562_BFPFP4iSySPLZKl4Ew-Vw0XVybqsvHm-WXJoyYc4iPEkNVJ45Lm9YNII-5drmLttzplK5J5CfFFvKX_4ppGkPXbND-pbrfM1-OQIWJGCRvEsn8xRHnH8G8TndUT0xPqQ7sWp_aKfE1WBgSF6IA-TnZT5OzmL01ndj8gFXLXRpBxwr5eJ89tfxh8O-E2MqRDKQu-11EszU2jHQknAEjBZL8Hx8dQDVUF12V2-neGovI-Q_4SQTpY27b5nMZcPEt.MACQf6C4QOKyrKFc',
      expectedOrigin: 'http://localhost:8000',
      serverAESKeySecret,
    });

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
          credentialMeta: {
            verifiedOrigin: 'http://localhost:8000',
            vct: 'urn:eu.europa.ec.eudi:pid:1',
          },
        },
      },
    );

    mockDate.restore();
  });

  it('should return all claims from a heterogenous mdoc presentation', async () => {
    const mockDate = new FakeTime(new Date('2025-04-28T20:52:47.456Z'));

    const data: DCAPIEncryptedResponse = {
      response:
        'eyJhcHUiOiIiLCJhcHYiOiIiLCJhbGciOiJFQ0RILUVTIiwiZW5jIjoiQTEyOEdDTSIsImVwayI6eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6InlQcE96OHRLRWlvamlOSFMxUDNNWm4zZ21QLW9xRzR4YjliZnNoSExoX0kiLCJ5IjoiV1ZqeG1iWHBxRjYxZ1hZR184MW9iekpBd0hsa3o5NURmVE41U3IwSU1JNCJ9fQ..TjFeNus57c-BFbM-.m0VRi3nluJd5NtkUCFZPr-qckl0n7vs7s6wHoPPAuVJQ4aMkSbDCqDrGT6rPowKPNtJnx5kJNAXNKXHmHtzwMcYIoDgMBpW5FhRUpgUY82KWKRZtJL9xk5P5EVcXtpISP_RvpgRzeeK0CcLxKeg6t1v4mnnjoh9_oN09SwS4fvuVXjsLfRWO1VKgfutxEhvTsMUHdutSk-UnTc1VzvvCyA2PTEjwY19mI41Cdi7et4Ih01rGoRIeOynKk_DELuaFj4GNxjk7bgZcxzeKgR7q95tlHCQ97akRANhz2HMgq9LOBjsHqLv8cqCoAReaw6fsIlsIt7KG0moTRXvSzt5SIg2gblNnKFe_eIzehC5aELaNpPoJr2r89U98I6RIv7xXktUuIqfkaXDOgN8_F5ldPuzSucgshr_gn6HUxQ0rXF5CBOL8w0cnGPSToXBnUp2m6BQIbqxiKejTYR3aAG3qNsJZH1N8eI6QpsixYpCGN9Mkuk1RMevxYU3lydZvduDlPvc7FFiTb_OhaHt34cEA2JMfjVks6Pe4zZ7ORP8MgXNQTvCcIGQQnqGwSppQt-hoAdmFyQqgrdROjkaiF_1omrDXOXscBRZtav-bLF2_NXS5p4qEhkGZ9_LKA79lYTOKHIxFxXEVk9IuqJII99AVeA5HRqAxLrdZFKECdu8KuTOePpo-BYDux-2PgQ3c-U5UYkg2gW4ZUvyN3PHbPqt53SD_9XqzlBZXSb9FF17KhzjacCt8GATMCkpqjNLVvVbTnWJjKNeRl7pMcWotoUoyrMgudL0qW4vU3is23UU2XGh7S6uPehOPGzrN0NvOA1nKyghDDAu_skXXmwwauLgC3YkLaVrrGmI549XuvOohd8l4PubP4OpW82bROSmkRW09sx9-uY6pQ-8SGekKHSxUSWc5GsbOzqdDnf2C7qiIPOMeqrZMAxoTSKGpXHv68s50lAXiYCi6JesrRY8tG0DQos7DQFz9GuLKe3xSUvT-Y_XItPOnGTdc6lgcif_iwOoWtY9VwipZ-TtUyhA_4pXqnsvuGYfosPpXz8BTdJGRwoQlbM3ue4A3OL1DmW66kWrZyeHSXYoCTdf_skouBAIScPawjzkYgknD0UEkyEC5tFuPP0tOOc3OgBjEj7Tzu_wIaHFcHJms4PWZTq_ty_9CYsF3gHShxU-sfnPquCdrav3dMGBcWuwtWdXkXfCz6snzEZAUsA2U06JTQf6mrFh6HHDN9iu4jMpZkDD5lIUO8Be-SY6OLay6ppBWPF6sKu94i7PaDULG2DjTdZV57Hg6eQ8frATuqHc0-A0fCgsO3W46H6PWTgP-2cvo-gboIt3Ng3yvsXpuP6q1wCzQYDZnNM-ijAknT3xC5EWMIqFf36afx5cYWnY2KKEuf71guechO71Vy8I8UCFf7Xd4XBobPB10i0Qzj7U7-pElBKWeLGQq_lYGxxLlpMgKURo1yZkzT1BuJz956oa2mgExgN0c3CjaG3PZfsBEjM--ghbJjYITzGUjwKa3EYu0mEoAP2LMCeC3DL3X1tzCO2Hx-DzHqqsNeShE4j7S0q3sOjg6SJDxieO24aqmodw-blwbwyD7aKzG_d9HboryU9f_Zi3WkQqjm2SQ4LpXP4QmDQhdnVsz_PBDJKth0F6nmqPWNNBGXauXFvF1FEgunx8vCvsowxXfQJ-mTHzJ6Yis7EJ0BvzgJ2Vz1p66NjIXwTGX98O7e2yOO99Jh3A1nM2t3hIvTD8Zhl9-H8vTYpZevhZs1VO0ju2cD3PGU8rbTSVHqmbGJYhaz4LhFg3RybuD1hUoTBe5Ybdu_DdDWotnvX4BtdbT4wzo4wnJKddN8NLgOYBlg146bgo5f_ZQQ90mWOjhXL5riDDRyFhSiMTasDb8OQS2U96VyUu9FMZYyrrGrgHze-3kn2Zg8jjld3aRZDhQfBnD3pm0OHldh3NHWdAv5HPPhskecW_ovMlTFrvFy9Uv16sJHqUSP_gdwM1ZpN-h2e95F559M5hhiao4F5vTcrtIvFBxjiLPE38s-7VJBy8S_1OawhW9kMSQZlQKIc-eu7C2pChZbA1B8esmimCE48x1s02Z5Hv0er-ymPNU0MTL0pYBt7T6MGuLWnvqF6tuKd0CWqNpUYU6qXU6w7IqGc5NpEVvKEOD276m17CgxOn8JM0RJ1AiBKpSAaZNrqG2h1KpcJikFl9eaf-HZhxnMugWQwa5lOxtiFmOq_IVlCBIQ3r6acDhYysia1ON21novaiuyrpLM_EwG0v3T15aKeTem9S84UhA5F-NBwHkrPkY09zeQRh41xUXtCJ_wH7hmIS3q2OKoOD8XnDpGzJCjljiP_LLQahCehBmuKWF0U1uTzP864CddbIs8SaVA8e6LlSnNyNB5uQNFbGprH-AgTInVo3Z_Mqjtxdcj8HwY1FaulPeKAcBaLUTnWwg9AU0qswZ-hitnBzsI2MCXrWmLcDq4jreXBNlicVf1OrgtfQLLPwHWEJxJV8ICxKt2GhlQS5rgsAVHLz6d_on7nF_OUQuwXWH1nhWmwza_KBvTUCrvTE4mH6Tjm3glA3EUvgKZA5BMdxjX9RQxWWQizSvOOIhnmD4WALgkNxAAyZZ8sBjr0ni7Gt1JBZstGflF2KGWDWRRLgFf9_9OzFl23WiSWo-o2W8-iW8q6UIG6ITtroi-GgZ9GZGbumbzw8rWfvKDveNfLFt_8l2k00vv90bd3bFZgnquqoWsJhmGHv86kJnMtCbYXtC4q50b-xrtAOC54gNvUhMKYXdml8mDTiYsq8mlIR2rwAtGp3_uKUQtAfPBr_KXFo5bE6186V0LVRIZHrQKZYS85WMlg1XmSao3DMWPbu2eFGuUMX6_X9gOgPI2qVdlFFO0YY_q3Rs_P0nwzu8dCPHVthLl5YNc6HXi5BWmmoeIy-BTdVYJdxo7XRCRHx4vbJDL5XBFWh54sMHVQUHJovf5od660U2Gs_-U8Gu3tC53oFyltYrcxOu7HTMRh1WAafg3DoA5-n3B98TN9bQWyDIi9-iY2YQIoeH_2eIlAphwOIBEdHCg8nmuJw_p94DIH2tjAr4pYP9zMD7K50sQYr7EB0G5L4DHrHeUZeTsGyJL5N5toD_Az6TiUH7PAMOj8P_jyilaXe7g6UDQEWa_SJD-tq0HBE-6R5Kf0siim6Mki3TaoDeQoXURW_L-fNDaaKdEUOaarENQQFApCRz6e0oUYzVMI7hzyshbNj7-xrhQUI4g5OonatoNDV7KHLeGzhT7Bcic72jhd3zGqBLqaS4C_Dr5cLCq7jxI4Jo4nrfSc9byCTbtDMSzdFDG_mP87J-Gm9rSYtGpmynKrvEqimIaTaZy3yOP7l5Rct_D1EJD1gYLS6TKlioV3Qe_mTzR5bfK-cU3AsCeqXypBzTRL-0UmueVyz61UdS-zOYixqkDIoF5T5NCQlR6loSKv4eo2-9nA9bIdowaEPq0_PPp--ncYuWa657sKKLK37TEF_jI5CsiNDeKUp7b90JsAFBs28Qg4Ynq9U4S_sNgfXmHGMBrg9E7d7bNSNk2C4DdthCF5BNueCXF56xhgePhxqvO3oLbT2Rl37-RFo3AM9EKxuiYmlVr2mnpHiSsIdr6oJqdzoC1UoytbSDkfm46aOOelfHFv3V51vGEQQf-gtYlz58mp7P8ZCv_DbGpgZt_yDB6agpRjLLBMDD5j5ycS6_eddJOLVKIfM2vCoDXnf4v3njkWuETEnkhnCyMdJTE12n55I37TsNqgCLjRixzFuk0_7RBYQbeYwZvvcghKju55kGkjzdRgKUXZIhyOFL6ZOJ1kWjRLCxrEvzlJcn7JHpq2ROSboceZTrSsL6YcHmNy9LARyWY3rt5h9vR07qY0LMEyKoptGGdKrO4gypAmktSnEEVbdLnEeDCC0tAK4.rOSxaJgoXAuCxCVpf9YTog',
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        'FisXDScwzm-waISuAAN5R8YF7WEI_58XApvVxOWVrMwOm932bqGpwdFQrporozVPLUyCk-1XgtBL3GQ5uT0B6S8ThT6fArAuszYW2eHWuPInEyJQ0m1QzfcCChCnY4UoTC9ocW0yFQXOt7ft7ZNJJsuql0kWPeAOCI2FI6EWpBWwE-B8oc96TdwMkg5hqbhJgjv4UVwV3lou-UPXK7sDU48rv-wsZU9BhnvrgmuC3NPhoGNs23rvD3Xzvw7sXveuTwRchap6gDfVwLukTX8YrGunGyICYHHlvlTCzW9gsuJlecA_FXEAFvJrK0jvNCLkGxY8AaCP8HQi.JOwmXY-wre2idWPB',
      expectedOrigin: 'http://localhost:8000',
      serverAESKeySecret,
    });

    assertExists(verified.cred1);
    assertEquals(verified.cred1.claims.issue_date, '2022-01-01');
    assertEquals(verified.cred1.claims.issuing_authority_unicode, 'DC.dev');
    assertEquals(verified.cred1.claims.vehicle_holder, '94043');
    assertEquals(verified.cred1.claims.registration_number, '1941000043');

    mockDate.restore();
  });

  it('should support multiple possible origins', async () => {
    const mockDate = new FakeTime(new Date('2025-04-28T17:40:48.169Z'));

    const data: DCAPIResponse = {
      vp_token: {
        cred1:
          'o2d2ZXJzaW9uYzEuMGlkb2N1bWVudHOBo2dkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGxpc3N1ZXJTaWduZWSiam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xgtgYWFSkaGRpZ2VzdElEAGZyYW5kb21QowIG7A9ukVpUbf4JQk38jXFlbGVtZW50SWRlbnRpZmllcmtmYW1pbHlfbmFtZWxlbGVtZW50VmFsdWVlU21pdGjYGFhRpGhkaWdlc3RJRAFmcmFuZG9tUMzj8HaMUvdAFMAHJ6Zt25dxZWxlbWVudElkZW50aWZpZXJqZ2l2ZW5fbmFtZWxlbGVtZW50VmFsdWVjSm9uamlzc3VlckF1dGiEQ6EBJqEYIVkCxDCCAsAwggJnoAMCAQICFB5_GzKtTzTv5LDMB7ew4zOnCxhNMAoGCCqGSM49BAMCMHkxCzAJBgNVBAYTAlVTMRMwEQYDVQQIDApDYWxpZm9ybmlhMRYwFAYDVQQHDA1Nb3VudGFpbiBWaWV3MRwwGgYDVQQKDBNEaWdpdGFsIENyZWRlbnRpYWxzMR8wHQYDVQQDDBZkaWdpdGFsY3JlZGVudGlhbHMuZGV2MB4XDTI1MDIxOTIzMzAxOFoXDTI2MDIxOTIzMzAxOFoweTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExFjAUBgNVBAcMDU1vdW50YWluIFZpZXcxHDAaBgNVBAoME0RpZ2l0YWwgQ3JlZGVudGlhbHMxHzAdBgNVBAMMFmRpZ2l0YWxjcmVkZW50aWFscy5kZXYwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATreTYr4tfzl8NQBH2D4eNiLONVazYPamjHWLsN3Gr4bAmvml1dDZk5dhLDWieRlpjKAA_IpMABbM2ISHjYBeNpo4HMMIHJMB8GA1UdIwQYMBaAFKJP9InZfEbobqOG2UdIzsy-3M_1MB0GA1UdDgQWBBTf_mpaEunAYsS8mKcl0tlw93pgKDA0BgNVHR8ELTArMCmgJ6AlhiNodHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2L2NybDAqBgNVHRIEIzAhhh9odHRwczovL2RpZ2l0YWwtY3JlZGVudGlhbHMuZGV2MA4GA1UdDwEB_wQEAwIHgDAVBgNVHSUBAf8ECzAJBgcogYxdBQECMAoGCCqGSM49BAMCA0cAMEQCIGHFy_V8weN78uCxM9ofIDEEXXCbWiEUDnpoMJvLB0LnAiBwr6LhxJv7p4wVzAnlGe0Ef8pqYxshyE8NufwfR_ULAlkDGNgYWQMTpmd2ZXJzaW9uYzEuMG9kaWdlc3RBbGdvcml0aG1nU0hBLTI1Nmdkb2NUeXBldW9yZy5pc28uMTgwMTMuNS4xLm1ETGx2YWx1ZURpZ2VzdHOhcW9yZy5pc28uMTgwMTMuNS4xrQBYILu5ibuAB7xz5TA1J31YS01Xph8CumuHvUxOqUE2OWFYAVggngwRC6EI2bOTa1TzvxVJ5ys-U0j8VBRm8w-zrtXO3dcCWCBZ8yZz3BnCJn0jfmIOydxtjwO73p5Dc8QrLVn04TWG3wNYIHbP3TYRZJ5w-oeuZhZ3MKrz0pQnasQkLTb306vTSfUaBFggCf63J-jnaQZV8TrJf7YCGQ2nZMDlfQTtr5RPM_x41b8FWCDblQsn_BzRcKkQiwjSGPXJfoojodcpPuKRC3utWNr45wZYIBmWZrBiD9Ahthc9j3I4H-zI59KynwHv3yK0dm-6A9SyB1ggJF0BWaxZ_m4nRi0BRbxMy42vWRcf5ur0HAsMsMqri6QIWCDJXpnYbOM6E8ZhjMmZfDgCD0kKNZNpWOGLH7ZPJCKMQglYIJOeWL6r0JFM5FHTzCou0hwyJP-bRLF-ucX8UWGgeToyClggs73eUbe8mXiDQpbfRfC8DtqAei-Q4ldxC0MNlIQvqKwLWCCAk4CaAwhSdmmmEUe92Rcl_onUT-ZWaxWALsPaPuJA8QxYIJX224tD_I90r-C3KpKQ9x9SyRDIQkBirWqxRnd8nmdWbWRldmljZUtleUluZm-haWRldmljZUtleaQBAiABIVggA30hYr0LwfvJH3s5RYJfVABWIkhpSae19vLndlHPU5giWCD4VPuW7U309tOp4vpwwAnOa-HovUUJWJi4axkRUjLTEGx2YWxpZGl0eUluZm-jZnNpZ25lZMB4GzIwMjUtMDQtMjVUMDY6NDU6MTEuOTY1MDAyWml2YWxpZEZyb23AeBsyMDI1LTA0LTI1VDA2OjQ1OjExLjk2NTAwOVpqdmFsaWRVbnRpbMB4GzIwMzUtMDQtMTNUMDY6NDU6MTEuOTY1MDEwWlhAswX7ivVe2SaCVPRrdMe2ZWISwkBFVSYepiRofVsBGtTlLGL26iAD8R2RfWoLxbYmNe9xCXgTDGFsFsmfX6xgn2xkZXZpY2VTaWduZWSiam5hbWVTcGFjZXPYGEGgamRldmljZUF1dGihb2RldmljZVNpZ25hdHVyZYRDoQEmoPZYQDboP-ZEpwAoG8mkXGCSXVE2-a2oGIaZh1Im6sM-b-KPLVzVDYHK6I9eVNv5aq6JxgRHgXStkz4Grko0I-Yu-eNmc3RhdHVzAA',
      },
    };

    const verified = await verifyPresentationResponse({
      data,
      nonce:
        'nBWacHSjO-2HFazXmC4Kej2ftuZL3jvWvJrqne9qnILBJGjkgcTwOrZ2DW8WXL7-deoOYcBB0pw.bHHdOd5C7ug5uBMk',
      expectedOrigin: [
        'http://localhost:12345',
        'http://localhost:8000', // This is the the real origin
      ],
      serverAESKeySecret,
    });

    // Just make sure we get a successful verification
    assertExists(verified.cred1);

    mockDate.restore();
  });
});
