import { assert, assertEquals, assertExists } from '@std/assert';
import { afterEach, beforeEach, describe, it } from '@std/testing/bdd';
import { type Stub, stub } from '@std/testing/mock';

import { generatePresentationRequest } from './generatePresentationRequest.ts';
import { _generateNonceInternals } from './helpers/nonce.ts';

describe('Method: generatePresentationRequest()', () => {
  let mockGenerateNonce: Stub;

  beforeEach(() => {
    mockGenerateNonce = stub(
      _generateNonceInternals,
      'stubThis',
      () => '9kMlSgHQW8oBv_AdkSaZKM0ajrEUatzg2f24vV6AgnI',
    );
  });

  afterEach(() => {
    mockGenerateNonce.restore();
  });

  it('should generate DC API options suitable for passing into `navigator.credentials.get()`', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdl',
        desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      },
      requestOrigin: 'https://digital-credentials.dev',
      encryptResponse: false,
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
      requestOrigin: 'https://digital-credentials.dev',
      encryptResponse: false,
    });

    const request = options.dcapiOptions.digital.requests[0];
    assertExists(request);

    assertEquals(request.protocol, 'openid4vp');
    assertEquals(request.data.response_type, 'vp_token');
    assertEquals(request.data.response_mode, 'dc_api');
    assertEquals(request.data.nonce, '9kMlSgHQW8oBv_AdkSaZKM0ajrEUatzg2f24vV6AgnI');
    assertExists(request.data.dcql_query.credentials);
    assertEquals(request.data.dcql_query.credentials.length, 1);
  });

  it('should generate an mDL query', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdl',
        desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      },
      requestOrigin: 'https://digital-credentials.dev',
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'cred1',
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
      requestOrigin: 'https://digital-credentials.dev',
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
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
    );
  });

  it('should generate options set up to encrypt response', async () => {
    const { dcapiOptions, requestMetadata } = await generatePresentationRequest({
      credentialOptions: {
        format: 'sd-jwt-vc',
        desiredClaims: ['family_name', 'given_name', 'age_over_21'],
      },
      requestOrigin: 'https://digital-credentials.dev',
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

  it('should generate a straightforward European PID mdoc request', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'mdoc',
        doctype: 'eu.europa.ec.eudi.pid.1',
        claimPathPrefix: 'eu.europa.ec.eudi.pid.1',
        desiredClaims: ['family_name', 'given_name', 'nationality'],
      },
      requestOrigin: 'https://digital-credentials.dev',
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'cred1',
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
      requestOrigin: 'https://digital-credentials.dev',
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'cred1',
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
      requestOrigin: 'https://digital-credentials.dev',
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'cred1',
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
      requestOrigin: 'https://digital-credentials.dev',
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
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
    );
  });

  it('should generate a straightforward European PID SD-JWT-VC request', async () => {
    const options = await generatePresentationRequest({
      credentialOptions: {
        format: 'sd-jwt-vc',
        desiredClaims: ['family_name', 'given_name'],
        acceptedVCTValues: ['urn:eu.europa.ec.eudi:pid:1'],
      },
      requestOrigin: 'https://digital-credentials.dev',
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'cred1',
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
      requestOrigin: 'https://digital-credentials.dev',
      encryptResponse: false,
    });

    assertEquals(
      options.dcapiOptions.digital.requests[0].data.dcql_query.credentials[0],
      {
        id: 'cred1',
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
