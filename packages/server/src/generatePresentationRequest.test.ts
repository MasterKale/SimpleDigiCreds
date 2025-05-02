import { assert, assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { type Stub, stub } from '@std/testing/mock';

import { generatePresentationRequest } from './generatePresentationRequest.ts';
import { decryptNonce } from './helpers/nonce.ts';
import { _generateEncryptionKeypairInternals } from './helpers/generateEncryptionKeypair.ts';

const serverAESKeySecret = new Uint8Array(32);
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

describe('Method: generatePresentationRequest()', () => {
  let mockGenerateEncryptionKeypair: Stub;

  beforeEach(() => {
    mockGenerateEncryptionKeypair = stub(_generateEncryptionKeypairInternals, 'stubThis', () => ({
      publicKeyJWK,
      privateKeyJWK,
    }));
  });

  afterEach(() => {
    mockGenerateEncryptionKeypair.restore();
  });

  it('should generate DC API options suitable for passing into `navigator.credentials.get()`', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdl',
        desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      },
      encryptResponse: false,
      serverAESKeySecret,
    });

    assertExists(options.dcapiOptions.digital.requests);
    assert(Array.isArray(options.dcapiOptions.digital.requests));
  });

  it('should use OID4VP protocol by default to request credentials', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdl',
        desiredClaims: ['family_name'],
      },
      serverAESKeySecret,
      encryptResponse: false,
    });

    const request = options.dcapiOptions.digital.requests[0];
    assertExists(request);

    assertEquals(request.protocol, 'openid4vp-v1-unsigned');
    assertEquals(request.data.response_type, 'vp_token');
    assertEquals(request.data.response_mode, 'dc_api');
    assertEquals(typeof request.data.nonce, 'string');
    assertExists(request.data.dcql_query.credentials);
    assertEquals(request.data.dcql_query.credentials.length, 1);
  });

  it('should generate an mDL query', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdl',
        desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      },
      serverAESKeySecret,
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'credential1',
        format: 'mso_mdoc',
        meta: { doctype_value: 'org.iso.18013.5.1.mDL' },
        claims: [
          { path: ['org.iso.18013.5.1', 'family_name'] },
          { path: ['org.iso.18013.5.1', 'given_name'] },
          { path: ['org.iso.18013.5.1', 'age_over_21'] },
        ],
      },
    );
  });

  it('should generate an SD-JWT-VC query', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'sd-jwt-vc',
        desiredClaims: ['family_name', 'given_name', 'age_over_21'],
        acceptedVCTValues: ['urn:eu.europa.ec.eudi:pid:1'],
      },
      serverAESKeySecret,
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'credential1',
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
    );
  });

  it('should generate options set up to encrypt response', async () => {
    const { dcapiOptions } = await generatePresentationRequest({
      credentialOptions: {
        format: 'sd-jwt-vc',
        desiredClaims: ['family_name', 'given_name', 'age_over_21'],
        acceptedVCTValues: ['urn:eu.europa.ec.eudi:pid:1'],
      },
      serverAESKeySecret,
      encryptResponse: true,
    });

    const { client_metadata } = dcapiOptions.digital.requests[0].data;

    assertEquals(dcapiOptions.digital.requests[0].data.response_mode, 'dc_api.jwt');
    assertEquals(
      client_metadata?.encrypted_response_enc_values_supported,
      undefined,
      'Encrypted responses should omit this so we can use the default of `A128GCM`',
    );
    // Make sure existing client_metadata entries aren't overwritten
    assertExists(client_metadata?.vp_formats_supported);

    // Assert we're specifying a valid public key JWK
    assertExists(client_metadata?.jwks);
    assertEquals(client_metadata.jwks.keys.length, 1);
    assertEquals(client_metadata.jwks.keys[0].kty, 'EC');
    assertEquals(client_metadata.jwks.keys[0].crv, 'P-256');
    assertEquals(client_metadata.jwks.keys[0].x, 'RIlPj8_a_azZ5Ed1ffhja2GFqRDKvjktB_8VK6S7hFo');
    assertEquals(client_metadata.jwks.keys[0].y, 'atJc71TYgZ9jUwgunsTGd8v2nxW0geCT9AvnIqmm4TQ');

    // Verify the corresponding private key is encrypted into the nonce
    const { nonce } = dcapiOptions.digital.requests[0].data;

    const decryptedNonce = await decryptNonce({ serverAESKeySecret, nonce });

    assertExists(decryptedNonce.privateKeyJWK);
    assertEquals(decryptedNonce.privateKeyJWK.kty, 'EC');
    assertEquals(decryptedNonce.privateKeyJWK.crv, 'P-256');
    assertEquals(decryptedNonce.privateKeyJWK.d, 'TVIl8mDFJV_QtM4RmwTLpHgHaCGePZ1qNZVIlT84Df8');
    assertEquals(decryptedNonce.privateKeyJWK.x, 'RIlPj8_a_azZ5Ed1ffhja2GFqRDKvjktB_8VK6S7hFo');
    assertEquals(decryptedNonce.privateKeyJWK.y, 'atJc71TYgZ9jUwgunsTGd8v2nxW0geCT9AvnIqmm4TQ');
  });

  it('should generate a straightforward European PID mdoc request', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdoc',
        doctype: 'eu.europa.ec.eudi.pid.1',
        claimPathPrefix: 'eu.europa.ec.eudi.pid.1',
        desiredClaims: ['family_name', 'given_name', 'nationality'],
      },
      serverAESKeySecret,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'credential1',
        format: 'mso_mdoc',
        meta: { doctype_value: 'eu.europa.ec.eudi.pid.1' },
        claims: [
          { path: ['eu.europa.ec.eudi.pid.1', 'family_name'] },
          { path: ['eu.europa.ec.eudi.pid.1', 'given_name'] },
          { path: ['eu.europa.ec.eudi.pid.1', 'nationality'] },
        ],
      },
    );
  });

  it('should generate a straightforward EMVCo payment card mdoc request', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdoc',
        doctype: 'com.emvco.payment_card',
        claimPathPrefix: 'com.emvco.payment_card.1',
        desiredClaims: ['card_number', 'card_network', 'expiry_year', 'expiry_month'],
      },
      serverAESKeySecret,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'credential1',
        format: 'mso_mdoc',
        meta: { doctype_value: 'com.emvco.payment_card' },
        claims: [
          { path: ['com.emvco.payment_card.1', 'card_number'] },
          { path: ['com.emvco.payment_card.1', 'card_network'] },
          { path: ['com.emvco.payment_card.1', 'expiry_year'] },
          { path: ['com.emvco.payment_card.1', 'expiry_month'] },
        ],
      },
    );
  });

  it('should generate a straightforward mVRC mdoc request', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdoc',
        doctype: 'org.iso.7367.1.mVRC',
        claimPathPrefix: 'org.iso.18013.5.1',
        desiredClaims: ['registration_number', 'date_of_registration', 'vehicle_holder'],
      },
      serverAESKeySecret,
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'credential1',
        format: 'mso_mdoc',
        meta: { doctype_value: 'org.iso.7367.1.mVRC' },
        claims: [
          { path: ['org.iso.18013.5.1', 'registration_number'] },
          { path: ['org.iso.18013.5.1', 'date_of_registration'] },
          { path: ['org.iso.18013.5.1', 'vehicle_holder'] },
        ],
      },
    );
  });

  it('should generate an mdoc request with claims across multiple namespaces', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdoc',
        doctype: 'org.iso.7367.1.mVRC',
        desiredClaims: [
          ['org.iso.23220.1', 'issue_date'],
          ['org.iso.23220.1', 'issuing_authority_unicode'],
          ['org.iso.7367.1', 'vehicle_holder'],
          ['org.iso.7367.1', 'registration_number'],
        ],
      },
      serverAESKeySecret,
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'credential1',
        format: 'mso_mdoc',
        meta: { doctype_value: 'org.iso.7367.1.mVRC' },
        claims: [
          { path: ['org.iso.23220.1', 'issue_date'] },
          { path: ['org.iso.23220.1', 'issuing_authority_unicode'] },
          { path: ['org.iso.7367.1', 'vehicle_holder'] },
          { path: ['org.iso.7367.1', 'registration_number'] },
        ],
      },
    );
  });

  it('should generate a straightforward European PID SD-JWT-VC request', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'sd-jwt-vc',
        desiredClaims: ['family_name', 'given_name'],
        acceptedVCTValues: ['urn:eu.europa.ec.eudi:pid:1'],
      },
      serverAESKeySecret,
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'credential1',
        format: 'dc+sd-jwt',
        meta: { vct_values: ['urn:eu.europa.ec.eudi:pid:1'] },
        claims: [
          { path: ['family_name'] },
          { path: ['given_name'] },
        ],
      },
    );
  });

  it('should generate a more complex SD-JWT-VC request with a mix of single-path and multi-path claims', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'sd-jwt-vc',
        desiredClaims: [
          'given_name',
          'family_name',
          ['age_equal_or_over', '18'],
        ],
        acceptedVCTValues: ['urn:eu.europa.ec.eudi:pid:1', 'urn:eudi:pid:1'],
      },
      serverAESKeySecret,
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'credential1',
        format: 'dc+sd-jwt',
        meta: { vct_values: ['urn:eu.europa.ec.eudi:pid:1', 'urn:eudi:pid:1'] },
        claims: [
          { path: ['given_name'] },
          { path: ['family_name'] },
          { path: ['age_equal_or_over', '18'] },
        ],
      },
    );
  });
});
