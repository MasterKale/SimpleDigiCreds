import {
  assert,
  assertEquals,
  assertExists,
  assertInstanceOf,
  assertRejects,
  assertStringIncludes,
} from '@std/assert';
import { afterEach, describe, it } from '@std/testing/bdd';
import { FakeTime } from '@std/testing/time';
import * as jose from 'jose';

import type { DCAPIEncryptedResponse } from './dcapi/types.ts';
import { verifyPresentationResponse } from './verifyPresentationResponse.ts';
import { SimpleDigiCredsError } from './helpers/index.ts';
import { decryptNonce, type ExpectedCredential, generateNonce } from './helpers/nonce.ts';
import { verifyMDocPresentation } from './formats/mdoc/index.ts';
import { verifySDJWTPresentation } from './formats/sd-jwt-vc/index.ts';
import {
  ENCRYPTED_MDOC_NONCE,
  ENCRYPTED_MDOC_RESPONSE,
  ENCRYPTED_SDJWT_NONCE,
  ENCRYPTED_SDJWT_RESPONSE,
} from './verifyPresentationResponse.fixtures.ts';

const serverAESKeySecret = new Uint8Array(32);

/**
 * Responses captured from a real wallet. See `verifyPresentationResponse.fixtures.ts`.
 */
type Capture = {
  response: string;
  nonce: string;
  /** The origin of the page the request was made from */
  origin: string;
  /** A time shortly after the response was captured. Fake time is set to this to avoid expiry */
  capturedAround: Date;
};

const SDJWT_CAPTURE: Capture = {
  response: ENCRYPTED_SDJWT_RESPONSE,
  nonce: ENCRYPTED_SDJWT_NONCE,
  origin: 'http://[::1]:8000',
  // The nonce was issued at 02:43:03Z, and the Key Binding JWT `iat` is 02:43:17Z
  capturedAround: new Date('2026-10-03T02:43:30.000Z'),
};

const MDOC_CAPTURE: Capture = {
  response: ENCRYPTED_MDOC_RESPONSE,
  nonce: ENCRYPTED_MDOC_NONCE,
  origin: 'http://localhost:8000',
  // The nonce was issued at 03:02:32Z
  capturedAround: new Date('2026-10-03T03:02:50.000Z'),
};

const mdocCredential: ExpectedCredential = {
  id: 'credential1',
  format: 'mso_mdoc',
  doctypeValue: 'eu.europa.ec.eudi.pid.1',
};

/**
 * Decrypt a captured response and return the presentation within, along with its nonce data
 */
async function decryptCapture({ response, nonce }: Capture) {
  const nonceData = await decryptNonce({ nonce, serverAESKeySecret });
  assertExists(nonceData.responseEncryptionKeys);

  const { plaintext } = await jose.compactDecrypt(
    response,
    nonceData.responseEncryptionKeys.privateKeyJWK,
  );
  const payload = JSON.parse(new TextDecoder().decode(plaintext));
  const [presentation] = Object.values(payload.vp_token)[0] as string[];

  return { nonceData, payload, presentation };
}

/**
 * Take a captured response and re-encrypt it, optionally changing the encryption or the payload.
 * The nonce contains the private key needed to decrypt the original response, and the public key
 * is reused so mdoc SessionTranscripts remain valid.
 */
async function reencryptResponse(capture: Capture, options: {
  enc?: 'A128GCM' | 'A256GCM';
  /** Defaults to the `kid` of the encryption key. Pass `null` to omit it */
  kid?: string | null;
  transformPayload?: (payload: Record<string, unknown>) => Record<string, unknown>;
} = {}): Promise<DCAPIEncryptedResponse> {
  const { enc = 'A256GCM', kid, transformPayload = (payload) => payload } = options;
  const { nonceData, payload } = await decryptCapture(capture);
  const { publicKeyJWK } = nonceData.responseEncryptionKeys!;

  const reencrypted = await new jose.CompactEncrypt(
    new TextEncoder().encode(JSON.stringify(transformPayload(payload))),
  )
    .setProtectedHeader({
      alg: 'ECDH-ES',
      enc,
      kid: kid === null ? undefined : kid ?? (publicKeyJWK as { kid?: string }).kid,
    })
    .encrypt(await jose.importJWK(publicKeyJWK, 'ECDH-ES'));

  return { response: reencrypted };
}

/**
 * Generate a nonce for an unencrypted request, for tests that don't need a real wallet's signature
 * over the nonce
 */
function generateTestNonce(expectedCredentials: ExpectedCredential[] = [mdocCredential]) {
  return generateNonce({ serverAESKeySecret, presentationLifetime: 300, expectedCredentials });
}

describe('Method: verifyPresentationResponse()', () => {
  let mockDate: FakeTime | undefined;

  afterEach(() => {
    mockDate?.restore();
    mockDate = undefined;
  });

  describe('response shape', () => {
    it('should error on missing `vp_token`', async () => {
      const rejected = await assertRejects(async () =>
        verifyPresentationResponse({
          data: {},
          nonce: await generateTestNonce(),
          expectedOrigin: '',
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'InvalidDCAPIResponse');
      assertEquals(rejected.message, 'Required object `response.vp_token` was missing');
    });

    it('should error on bad `vp_token`', async () => {
      const rejected = await assertRejects(async () =>
        verifyPresentationResponse({
          data: { vp_token: '' },
          nonce: await generateTestNonce(),
          expectedOrigin: '',
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'InvalidDCAPIResponse');
      assertEquals(rejected.message, 'Required object `response.vp_token` was missing');
    });

    it('should error on bad `vp_token` entries', async () => {
      const nonce = await generateTestNonce();

      // A bare string is how OID4VP Draft 28 and earlier returned presentations
      for (const badEntry of ['presentation', 12345, [], [12345], {}]) {
        const rejected = await assertRejects(() =>
          verifyPresentationResponse({
            data: { vp_token: { credential1: badEntry } },
            nonce,
            expectedOrigin: '',
            serverAESKeySecret,
          })
        );

        assertInstanceOf(rejected, SimpleDigiCredsError);
        assertEquals(rejected.code, 'InvalidDCAPIResponse');
        assertEquals(
          rejected.message,
          'Object `response.vp_token` contained entries that were not arrays of strings',
        );
      }
    });

    it('should error when more than one presentation is returned for a query', async () => {
      const rejected = await assertRejects(async () =>
        verifyPresentationResponse({
          data: { vp_token: { credential1: ['presentation1', 'presentation2'] } },
          nonce: await generateTestNonce(),
          expectedOrigin: 'http://localhost:8000',
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'InvalidDCAPIResponse');
      assertStringIncludes(rejected.message, 'Expected exactly one presentation');
    });

    it('should error when the nonce has expired', async () => {
      mockDate = new FakeTime(new Date('2026-10-03T03:00:00.000Z'));
      const nonce = await generateTestNonce();

      // Presentation lifetime is 300 seconds
      mockDate.tick(301 * 1000);

      const rejected = await assertRejects(() =>
        verifyPresentationResponse({
          data: { vp_token: { credential1: ['presentation'] } },
          nonce,
          expectedOrigin: 'http://localhost:8000',
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'InvalidDCAPIResponse');
      assertStringIncludes(rejected.message, 'Nonce expired at');
    });
  });

  describe('wallet errors', () => {
    it('should surface an unencrypted wallet error', async () => {
      const rejected = await assertRejects(async () =>
        verifyPresentationResponse({
          data: { error: 'access_denied', error_description: 'User declined' },
          nonce: await generateTestNonce(),
          expectedOrigin: 'http://localhost:8000',
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'WalletErrorResponse');
      assertEquals(rejected.walletError, 'access_denied');
      assertEquals(rejected.message, 'Wallet returned error "access_denied": User declined');
    });

    it('should surface a wallet error inside an encrypted response', async () => {
      mockDate = new FakeTime(SDJWT_CAPTURE.capturedAround);

      const data = await reencryptResponse(SDJWT_CAPTURE, {
        transformPayload: () => ({ error: 'vp_formats_not_supported' }),
      });

      const rejected = await assertRejects(() =>
        verifyPresentationResponse({
          data,
          nonce: SDJWT_CAPTURE.nonce,
          expectedOrigin: SDJWT_CAPTURE.origin,
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'WalletErrorResponse');
      assertEquals(rejected.walletError, 'vp_formats_not_supported');
    });
  });

  describe('mdoc', () => {
    it('should verify an encrypted mdoc presentation', async () => {
      mockDate = new FakeTime(MDOC_CAPTURE.capturedAround);

      const verified = await verifyPresentationResponse({
        data: { response: MDOC_CAPTURE.response },
        nonce: MDOC_CAPTURE.nonce,
        expectedOrigin: MDOC_CAPTURE.origin,
        serverAESKeySecret,
      });

      assertEquals(verified.credential1.presentationMeta, {
        verifiedOrigin: 'http://localhost:8000',
      });
      assertEquals(Object.keys(verified.credential1.claims).length, 3);
      assertEquals(verified.credential1.issuerMeta, {
        issuedAt: new Date('2026-08-31T14:13:28.000Z'),
        validFrom: new Date('2026-08-31T14:13:28.000Z'),
        expiresOn: new Date('2036-08-18T14:13:28.000Z'),
      });
    });

    for (const enc of ['A128GCM', 'A256GCM'] as const) {
      it(`should verify an mdoc presentation encrypted with ${enc}`, async () => {
        mockDate = new FakeTime(MDOC_CAPTURE.capturedAround);

        const data = await reencryptResponse(MDOC_CAPTURE, { enc });

        const verified = await verifyPresentationResponse({
          data,
          nonce: MDOC_CAPTURE.nonce,
          expectedOrigin: MDOC_CAPTURE.origin,
          serverAESKeySecret,
        });

        assertEquals(Object.keys(verified.credential1.claims).length, 3);
      });
    }

    it('should support multiple possible origins', async () => {
      mockDate = new FakeTime(MDOC_CAPTURE.capturedAround);

      const verified = await verifyPresentationResponse({
        data: { response: MDOC_CAPTURE.response },
        nonce: MDOC_CAPTURE.nonce,
        expectedOrigin: [
          'http://localhost:12345',
          'http://localhost:8000', // This is the the real origin
        ],
        serverAESKeySecret,
      });

      assertEquals(verified.credential1.presentationMeta.verifiedOrigin, 'http://localhost:8000');
    });

    it('should reject an mdoc whose docType does not match the requested doctype', async () => {
      mockDate = new FakeTime(MDOC_CAPTURE.capturedAround);
      const { presentation } = await decryptCapture(MDOC_CAPTURE);

      const rejected = await assertRejects(() =>
        verifyMDocPresentation({
          presentation,
          nonce: MDOC_CAPTURE.nonce,
          possibleOrigins: [MDOC_CAPTURE.origin],
          expectedDoctype: 'org.iso.7367.1.mVRC',
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'MdocVerificationError');
      assertStringIncludes(rejected.message, 'did not match requested doctype');
    });

    it('should throw when DeviceSigned does not verify for the expected origin', async () => {
      mockDate = new FakeTime(MDOC_CAPTURE.capturedAround);

      const rejected = await assertRejects(() =>
        verifyPresentationResponse({
          data: { response: MDOC_CAPTURE.response },
          nonce: MDOC_CAPTURE.nonce,
          expectedOrigin: 'https://not-the-real-origin.example.com',
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'MdocVerificationError');
    });
  });

  describe('SD-JWT VC', () => {
    it('should verify an encrypted SD-JWT presentation', async () => {
      mockDate = new FakeTime(SDJWT_CAPTURE.capturedAround);

      const verified = await verifyPresentationResponse({
        data: { response: SDJWT_CAPTURE.response },
        nonce: SDJWT_CAPTURE.nonce,
        expectedOrigin: SDJWT_CAPTURE.origin,
        serverAESKeySecret,
      });

      assertEquals(verified, {
        credential1: {
          claims: {
            given_name: 'Erika',
            family_name: 'Mustermann',
            '18': true,
          },
          issuerMeta: {
            expiresOn: new Date('2029-09-01T23:33:20.000Z'),
            issuedAt: new Date('2023-05-02T04:00:00.000Z'),
            validFrom: undefined,
          },
          presentationMeta: {
            verifiedOrigin: 'http://[::1]:8000',
            vct: 'urn:eudi:pid:1',
          },
        },
      });
    });

    for (const enc of ['A128GCM', 'A256GCM'] as const) {
      it(`should verify an SD-JWT presentation encrypted with ${enc}`, async () => {
        mockDate = new FakeTime(SDJWT_CAPTURE.capturedAround);

        const data = await reencryptResponse(SDJWT_CAPTURE, { enc });

        const verified = await verifyPresentationResponse({
          data,
          nonce: SDJWT_CAPTURE.nonce,
          expectedOrigin: SDJWT_CAPTURE.origin,
          serverAESKeySecret,
        });

        assertEquals(verified.credential1.claims.given_name, 'Erika');
      });
    }

    it('should verify an encrypted SD-JWT presentation whose JWE omits kid', async () => {
      mockDate = new FakeTime(SDJWT_CAPTURE.capturedAround);

      const data = await reencryptResponse(SDJWT_CAPTURE, { kid: null });

      const verified = await verifyPresentationResponse({
        data,
        nonce: SDJWT_CAPTURE.nonce,
        expectedOrigin: SDJWT_CAPTURE.origin,
        serverAESKeySecret,
      });

      assertEquals(verified.credential1.claims.given_name, 'Erika');
    });

    it('should reject an encrypted response whose JWE kid does not match', async () => {
      mockDate = new FakeTime(SDJWT_CAPTURE.capturedAround);

      const data = await reencryptResponse(SDJWT_CAPTURE, { kid: 'some-other-key' });

      const rejected = await assertRejects(() =>
        verifyPresentationResponse({
          data,
          nonce: SDJWT_CAPTURE.nonce,
          expectedOrigin: SDJWT_CAPTURE.origin,
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'InvalidDCAPIResponse');
      assertStringIncludes(rejected.message, 'did not match expected kid');
    });

    it('should reject a holder-bound SD-JWT presented without a Key Binding JWT', async () => {
      mockDate = new FakeTime(SDJWT_CAPTURE.capturedAround);

      const data = await reencryptResponse(SDJWT_CAPTURE, {
        transformPayload: (payload) => {
          const vpToken = payload.vp_token as Record<string, string[]>;
          return {
            ...payload,
            vp_token: Object.fromEntries(
              Object.entries(vpToken).map(([credID, [presentation]]) => [
                credID,
                // Drop the KB-JWT off the end, leaving the trailing tilde
                [presentation.slice(0, presentation.lastIndexOf('~') + 1)],
              ]),
            ),
          };
        },
      });

      const rejected = await assertRejects(() =>
        verifyPresentationResponse({
          data,
          nonce: SDJWT_CAPTURE.nonce,
          expectedOrigin: SDJWT_CAPTURE.origin,
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'SDJWTVerificationError');
      assertEquals(rejected.message, 'Presentation was missing required Key Binding JWT');
    });

    it('should reject an SD-JWT whose vct was not requested', async () => {
      mockDate = new FakeTime(SDJWT_CAPTURE.capturedAround);
      const { presentation } = await decryptCapture(SDJWT_CAPTURE);

      const rejected = await assertRejects(() =>
        verifySDJWTPresentation({
          presentation,
          nonce: SDJWT_CAPTURE.nonce,
          possibleOrigins: [SDJWT_CAPTURE.origin],
          expectedVCTValues: ['urn:eu.europa.ec.eudi:pid:1'],
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'SDJWTVerificationError');
      assertStringIncludes(rejected.message, 'was not one of the requested vct values');
    });

    it('should reject a Key Binding JWT with the wrong audience', async () => {
      mockDate = new FakeTime(SDJWT_CAPTURE.capturedAround);

      const rejected = await assertRejects(() =>
        verifyPresentationResponse({
          data: { response: SDJWT_CAPTURE.response },
          nonce: SDJWT_CAPTURE.nonce,
          expectedOrigin: 'https://not-the-real-origin.example.com',
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'SDJWTVerificationError');
    });
  });

  describe('matching the response to the request', () => {
    it('should reject credentials that were not requested', async () => {
      const rejected = await assertRejects(async () =>
        verifyPresentationResponse({
          data: { vp_token: { someOtherCredential: ['presentation'] } },
          nonce: await generateTestNonce(),
          expectedOrigin: 'http://localhost:8000',
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'InvalidDCAPIResponse');
      assertEquals(
        rejected.message,
        'Response contained unrequested credential "someOtherCredential"',
      );
    });

    it('should reject responses missing a requested credential', async () => {
      const rejected = await assertRejects(async () =>
        verifyPresentationResponse({
          data: { vp_token: {} },
          nonce: await generateTestNonce(),
          expectedOrigin: 'http://localhost:8000',
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'InvalidDCAPIResponse');
      assertEquals(rejected.message, 'Response was missing requested credential "credential1"');
    });

    it('should use the requested format instead of guessing from the presentation', async () => {
      const { presentation: sdJWTPresentation } = await decryptCapture(SDJWT_CAPTURE);

      // Claim an mdoc was requested, then return an SD-JWT
      const rejected = await assertRejects(async () =>
        verifyPresentationResponse({
          data: { vp_token: { credential1: [sdJWTPresentation] } },
          nonce: await generateTestNonce(),
          expectedOrigin: SDJWT_CAPTURE.origin,
          serverAESKeySecret,
        })
      );

      assertInstanceOf(rejected, SimpleDigiCredsError);
      assertEquals(rejected.code, 'MdocVerificationError');
      assert(rejected.message.includes('not a base64url string'));
    });
  });
});
