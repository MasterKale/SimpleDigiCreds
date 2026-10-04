import { assert, assertEquals, assertExists, assertRejects } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { FakeTime } from '@std/testing/time';
import { type Stub, stub } from '@std/testing/mock';

import { decryptNonce, type ExpectedCredential, generateNonce } from './nonce.ts';
import { base64url, SimpleDigiCredsError } from './index.ts';
import type { Uint8Array_ } from './types.ts';
import { decryptAESGCM, encryptAESGCM, importAESGCMKey } from './cryptoAESGCM.ts';
import {
  _generateEncryptionKeypairInternals,
  generateEncryptionKeypair,
} from './generateEncryptionKeypair.ts';
import type { OID4VPResponseEncryptionJWK } from '../protocols/oid4vp/types.ts';

const publicKeyJWK: OID4VPResponseEncryptionJWK = {
  kty: 'EC',
  crv: 'P-256',
  x: 'RIlPj8_a_azZ5Ed1ffhja2GFqRDKvjktB_8VK6S7hFo',
  y: 'atJc71TYgZ9jUwgunsTGd8v2nxW0geCT9AvnIqmm4TQ',
  kid: 'test-kid',
  alg: 'ECDH-ES',
  use: 'enc',
};

const privateKeyJWK: JsonWebKey = {
  kty: 'EC',
  crv: 'P-256',
  x: 'RIlPj8_a_azZ5Ed1ffhja2GFqRDKvjktB_8VK6S7hFo',
  y: 'atJc71TYgZ9jUwgunsTGd8v2nxW0geCT9AvnIqmm4TQ',
  d: 'TVIl8mDFJV_QtM4RmwTLpHgHaCGePZ1qNZVIlT84Df8',
};

describe('Method: generateNonce()', () => {
  let mockDate: FakeTime;
  let mockGenerateEncryptionKeypair: Stub;

  beforeEach(() => {
    mockDate = new FakeTime(new Date('2025-04-28T17:40:48.169Z'));
    mockGenerateEncryptionKeypair = stub(
      _generateEncryptionKeypairInternals,
      'stubThis',
      () => ({ publicKeyJWK, privateKeyJWK }),
    );
  });

  afterEach(() => {
    mockDate.restore();
    mockGenerateEncryptionKeypair.restore();
  });

  it('should generate a nonce containing encrypted expiration', async () => {
    const serverAESKeySecret: Uint8Array_ = new Uint8Array(32);

    const nonce = await generateNonce({
      serverAESKeySecret,
      presentationLifetime: 300, // 5 minutes
      expectedCredentials: [],
    });
    const nonceParts = nonce.split('.');

    // Assert that the nonce is in the expected format
    assertEquals(nonceParts.length, 2);

    // Make sure the nonce can be decrypted with the same key
    const encryptedDataBytes = base64url.base64URLToBuffer(nonceParts[0]);
    const ivBytes = base64url.base64URLToBuffer(nonceParts[1]);

    const decrypted = await decryptAESGCM(
      encryptedDataBytes,
      ivBytes,
      await importAESGCMKey(serverAESKeySecret),
    );

    const decryptedString = new TextDecoder().decode(decrypted);
    const decryptedJSON = JSON.parse(decryptedString);

    assertExists(decryptedJSON.expiresOn);
    assertEquals(
      decryptedJSON.expiresOn,
      '2025-04-28T17:45:48.169Z',
      'Expiration time should be five minutes from now',
    );
    assertEquals(
      decryptedJSON.responseEncryptionKeys,
      undefined,
      'Response encryption keys should not be present in the nonce when not provided',
    );
  });

  it('should round-trip expected credentials through the nonce', async () => {
    const serverAESKeySecret: Uint8Array_ = new Uint8Array(32);

    const nonce = await generateNonce({
      serverAESKeySecret,
      presentationLifetime: 300,
      expectedCredentials: [
        { id: 'credential1', format: 'mso_mdoc', doctypeValue: 'org.iso.18013.5.1.mDL' },
      ],
    });

    const decrypted = await decryptNonce({ serverAESKeySecret, nonce });

    assertEquals(decrypted.expiresOn, new Date('2025-04-28T17:45:48.169Z'));
    assertEquals(decrypted.expectedCredentials, [
      { id: 'credential1', format: 'mso_mdoc', doctypeValue: 'org.iso.18013.5.1.mDL' },
    ]);
  });

  it('should generate a nonce containing encrypted expiration, and response encryption keypair when provided', async () => {
    const serverAESKeySecret: Uint8Array_ = new Uint8Array(32);
    const { privateKeyJWK, publicKeyJWK } = await generateEncryptionKeypair();

    const nonce = await generateNonce({
      serverAESKeySecret,
      presentationLifetime: 300, // 5 minutes
      responseEncryptionKeys: { publicKeyJWK, privateKeyJWK },
      expectedCredentials: [],
    });
    const [ciphertext, iv] = nonce.split('.');

    // Make sure the nonce can be decrypted with the same key
    const encryptedDataBytes = base64url.base64URLToBuffer(ciphertext);
    const ivBytes = base64url.base64URLToBuffer(iv);

    const decrypted = await decryptAESGCM(
      encryptedDataBytes,
      ivBytes,
      await importAESGCMKey(serverAESKeySecret),
    );

    const decryptedString = new TextDecoder().decode(decrypted);
    const decryptedJSON = JSON.parse(decryptedString);

    // Assert that the nonce contains the expected values
    assertExists(decryptedJSON.expiresOn);
    assertEquals(
      decryptedJSON.expiresOn,
      '2025-04-28T17:45:48.169Z',
      'Expiration time should be five minutes from now',
    );
    assertEquals(
      decryptedJSON.responseEncryptionKeys?.privateKeyJWK,
      privateKeyJWK,
      'Private key JWK should be present in the nonce',
    );
    assertEquals(
      decryptedJSON.responseEncryptionKeys?.publicKeyJWK,
      publicKeyJWK,
      'Public key JWK should be present in the nonce',
    );
  });
});

describe('Method: decryptNonce()', () => {
  const serverAESKeySecret: Uint8Array_ = new Uint8Array(32);
  const expectedCredentials: ExpectedCredential[] = [
    { id: 'credential1', format: 'mso_mdoc', doctypeValue: 'org.iso.18013.5.1.mDL' },
  ];

  it('should decrypt a nonce with expiration and expected credentials', async () => {
    const nonce =
      'kXzFCMtmT7N6GdHXl_it2sjXbk_l1_Y68pTqm7oqe_xv9SzVimb_0kjrgfIr1_dZuO-b-5WhUcrBNuLZVpMVEUwa3q' +
      'aEy-eul4l6G7WTmDaAH0a0_zQLM8hHI0_d8gu_cBY5lchcEPu2hx9dO7e2B9aW3O7W9HnViuaIG4m54D2THsZ3hHys' +
      'UFz8bGz8i8VdM92XdRGTV0oqTtnfD1DJx1Xx53O_Ne_zcjoNSOVVKxZpJsJhciU0WtKaKnD-TagTb9TeDLVR.HhZCq' +
      '-ukVeFOOsD-';

    const decrypted = await decryptNonce({ serverAESKeySecret, nonce });

    assertEquals(
      decrypted.expiresOn,
      new Date('2025-04-28T17:45:48.169Z'),
      'Expiration time should be five minutes from now',
    );
    assertEquals(decrypted.expectedCredentials, expectedCredentials);
    assertEquals(decrypted.responseEncryptionKeys?.privateKeyJWK, undefined);
    assertEquals(decrypted.responseEncryptionKeys?.publicKeyJWK, undefined);
  });

  it('should decrypt a nonce with expiration, expected credentials, and encryption keypair', async () => {
    const nonce =
      'fIKJWdEwG3FFm5gB0AdDvDjIm4wOdNFi_g8mVshKrW0fR8cXbsdDSqrI-uHZXzM1SFPU-S3dJbQ3QD1hDvtEPkX62c' +
      'OpxrD08pE5rZgL-ywFxfdtSkCRiE1iRavoZ4REtbmm8li3zzAH9SBhCspe-Ei716VfbtWd7yiSw_syxwWzaFHBFHEw' +
      '6vkl0fkLxaquGB1res7R7Kxu0lEFrzhmH97ydZPHw82yyzR-SiNPjellovdHg_NWkVf8pEsBDu8KghqpflSR8-X1G5' +
      'Fm3MwHBTwqzR5bsRCsILRAJHrN7X8JAYoIV1DaN852JO1xW1P0PnAAwyTDl6q45qj5nWYBs_QvPAB6Z8vyaCeAHeuZ' +
      '3oTetr_7cfja6SRCW4WpXeZO0BuVpWjOp_jJON0HHG-BAxtflKYCBO80HQZCxmU7ShffMVpEcVy88XJIIaIECIfU8O' +
      'fi2N89D_nwGMVMBc31Ni2lK6UXvH08Q6jq98w43jpPViS8n50ztjTNJ1JKIxVNw4Lo3K1ohjiagPbFl5QqPjlN8k05' +
      'Jfl6SfM88pLgmi62heK_0ZVftYnz3xUReXAnE-AGISYwG_giw7zWm1pa1daAM0qyV87DPabt4NtiRZyEKXaE6uKTz9' +
      'WpFtc1lQL9fVzrQ7NxorGpTLH_NPigDMm4FqaeuCOMi76CNQxMxW6BacEN_Ip8zqGb7araoc-yjGdF-4Qwi4GaRudB' +
      '6-4PIN6wrn-aQNVQCl6G49hUWKLJEh0VjpNyF0K9VhCpXekRt0-C91SG7zk9Tj_V60wZN7OcQ9ajIRtY8rjUYds.6j' +
      '5fAULGqYL5Cwb4';

    const decrypted = await decryptNonce({ serverAESKeySecret, nonce });

    assertEquals(decrypted.expiresOn, new Date('2025-04-28T17:45:48.169Z'));
    assertEquals(decrypted.expectedCredentials, expectedCredentials);
    assertEquals(decrypted.responseEncryptionKeys?.privateKeyJWK, privateKeyJWK);
    assertEquals(decrypted.responseEncryptionKeys?.publicKeyJWK, publicKeyJWK);
  });

  it('should throw an error if the nonce is not in the expected format', async () => {
    const serverAESKeySecret: Uint8Array_ = new Uint8Array(32);
    const invalidNonce = 'invalid-nonce-format';

    await assertRejects(
      () => decryptNonce({ serverAESKeySecret, nonce: invalidNonce }),
      Error,
      'Nonce was not in the expected format',
    );
  });

  it('should throw an error if the server secret is invalid', async () => {
    const invalidServerAESKeySecret: Uint8Array_ = new Uint8Array(16);
    const nonce =
      'l5fkvda0Nhuurfuo_dBKb4knrEKdTATl9mgDeyG19ZbeEj5NKyyqzfmEo07HBqpelDumvRuV4Ls.tlDg1Rg6kh_sQYaH';

    await assertRejects(
      () => decryptNonce({ serverAESKeySecret: invalidServerAESKeySecret, nonce }),
      SimpleDigiCredsError,
      'AES key secret was not 32 bytes',
    );
  });

  describe('nonces from older versions of this library', () => {
    /** Encrypt arbitrary JSON the same way `generateNonce()` does */
    async function encryptNonceData(data: object): Promise<string> {
      const [encrypted, iv] = await encryptAESGCM(
        new Uint8Array(new TextEncoder().encode(JSON.stringify(data))),
        await importAESGCMKey(serverAESKeySecret),
      );
      return `${base64url.bufferToBase64URL(encrypted)}.${base64url.bufferToBase64URL(iv)}`;
    }

    it('should throw a library error if an expected credential is malformed', async () => {
      const malformed = [
        { id: 'credential1', format: 'mso_mdoc' },
        { id: 'credential1', format: 'dc+sd-jwt', vctValues: [] },
        { id: 'credential1', format: 'something-else', doctypeValue: 'x' },
        { format: 'mso_mdoc', doctypeValue: 'x' },
        null,
      ];

      for (const entry of malformed) {
        const nonce = await encryptNonceData({
          expiresOn: '2025-04-28T17:45:48.169Z',
          expectedCredentials: [entry],
        });

        const rejected = await assertRejects(() => decryptNonce({ serverAESKeySecret, nonce }));

        assert(rejected instanceof SimpleDigiCredsError);
        assertEquals(rejected.code, 'InvalidDCAPIResponse');
        assertEquals(rejected.message, 'Nonce data contained a malformed expected credential');
      }
    });

    it('should throw a library error if the nonce has no expected credentials', async () => {
      const nonce = await encryptNonceData({
        expiresOn: '2025-04-28T17:45:48.169Z',
      });

      const rejected = await assertRejects(() => decryptNonce({ serverAESKeySecret, nonce }));

      assert(rejected instanceof SimpleDigiCredsError);
      assertEquals(rejected.code, 'InvalidDCAPIResponse');
      assertEquals(rejected.message, 'Nonce data did not contain the expected credentials');
    });
  });
});
