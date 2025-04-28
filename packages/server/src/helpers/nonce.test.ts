import { assertEquals, assertExists, assertRejects } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { FakeTime } from '@std/testing/time';
import { type Stub, stub } from '@std/testing/mock';

import { decryptNonce, generateNonce } from './nonce.ts';
import { base64url, SimpleDigiCredsError } from './index.ts';
import type { Uint8Array_ } from './types.ts';
import { decryptAESGCM } from './decryptAESGCM.ts';
import { importAESGCMKey } from './importAESGCMKey.ts';
import {
  _generateEncryptionKeypairInternals,
  generateEncryptionKeypair,
} from './generateEncryptionKeypair.ts';

const publicKeyJWK: JsonWebKey = {
  kty: 'EC',
  crv: 'P-256',
  x: 'RIlPj8_a_azZ5Ed1ffhja2GFqRDKvjktB_8VK6S7hFo',
  y: 'atJc71TYgZ9jUwgunsTGd8v2nxW0geCT9AvnIqmm4TQ',
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
      decryptedJSON.privateKeyJWK,
      undefined,
      'Private key JWK should not be present in the nonce when not provided',
    );
  });

  it('should generate a nonce containing encrypted expiration, and private key when provided', async () => {
    const serverAESKeySecret: Uint8Array_ = new Uint8Array(32);
    const { privateKeyJWK } = await generateEncryptionKeypair();

    const nonce = await generateNonce({
      serverAESKeySecret,
      presentationLifetime: 300, // 5 minutes
      privateKeyJWK,
    });
    const [cipertext, iv] = nonce.split('.');

    // Make sure the nonce can be decrypted with the same key
    const encryptedDataBytes = base64url.base64URLToBuffer(cipertext);
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
    assertExists(decryptedJSON.privateKeyJWK);
    assertEquals(
      decryptedJSON.privateKeyJWK,
      privateKeyJWK,
      'Private key JWK should be present in the nonce',
    );
  });
});

describe('Method: decryptNonce()', () => {
  it('should decrypt a nonce with expiration', async () => {
    const serverAESKeySecret: Uint8Array_ = new Uint8Array(32);
    const nonce =
      'l5fkvda0Nhuurfuo_dBKb4knrEKdTATl9mgDeyG19ZbeEj5NKyyqzfmEo07HBqpelDumvRuV4Ls.tlDg1Rg6kh_sQYaH';

    const decrypted = await decryptNonce({
      serverAESKeySecret,
      nonce,
    });

    assertExists(decrypted.expiresOn);
    assertEquals(
      decrypted.expiresOn,
      new Date('2025-04-28T17:45:48.169Z'),
      'Expiration time should be five minutes from now',
    );
    assertEquals(decrypted.privateKeyJWK, undefined);
  });

  it('should decrypt a nonce with expiration and private key', async () => {
    const nonce =
      'MjDZm_4K7N_xfsNcuW21q68I0MDpqaArFDP5-lkeVgm1ZHWs-RhZiGc4mKLpm7ny6H8KOVb6ngy05iDOpeAeLb6_4ST7p37xrHlX7j-eR_sS2eCJqdZ3w5PW9LM89IXTeug6cVN47kKqHYsvz6Kr6TdAR20cSJWuft2R2BTUSRDlZepFAn3WPBrJo65qa4VSIpsBJqNYQOnZ6gKI_zx9srvSKnROW18WNVm0JWItYyqq7JbA7w-pDpzzDBgGcJgGDHdJExsrukwtDpWahirsfogVXmzSBB1Tp-xXPRtLJXeJWGFK2JjsO0evd6tqGR07_Baox3wlW6Wx.U9CqrlZdTdOTAy5U';

    const decrypted = await decryptNonce({ serverAESKeySecret: new Uint8Array(32), nonce });

    assertEquals(decrypted.expiresOn, new Date('2025-04-28T17:45:48.169Z'));
    assertEquals(decrypted.privateKeyJWK, privateKeyJWK);
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
      'Failed to decrypt data',
    );
  });
});
