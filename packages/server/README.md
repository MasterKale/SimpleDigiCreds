# @simpledigicreds/server <!-- omit in toc -->

Part of a collection of TypeScript-first libraries for simpler Digital Credential presentation and
verification.

- [Installation](#installation)
  - [Node LTS 22.x and higher](#node-lts-22x-and-higher)
  - [Deno 2.1 and higher](#deno-21-and-higher)
- [Usage](#usage)
- [Example Presentation Requests](#example-presentation-requests)

## Installation

This package can be installed from **[NPM](https://www.npmjs.com/package/@simplewebauthn/server)**
and **[JSR](https://jsr.io/@simplewebauthn/server)**:

### Node LTS 22.x and higher

```sh
npm install @simplewebauthn/server
```

### Deno 2.1 and higher

```sh
deno add jsr:@simplewebauthn/server
```

## Usage

The simplest way to get started is to import the methods required for generating a Digital
Credentials API presentation request, then parsing the subsequent presentation response:

```ts
import { generatePresentationOptions, verifyPresentationResponse } from '@simpledigicreds/server';

/** Server */
// A random 32-byte value used for encryption and decryption
const serverAESKeySecret: Uint8Array = secretKeyToBytes(process.env.AES_SECRET_KEY);

const { dcapiOptions } = await generatePresentationRequest({
  credentialOptions: {
    format: 'mdl',
    desiredClaims: ['family_name', 'given_name'],
  },
  presentationLifetime: 600, // seconds, defaults to 300 seconds
  serverAESKeySecret,
});

/** Browser */
if (typeof window.DigitalCredential === 'function') {
  const response = await navigator.credentials.get(dcapiOptions);

  sendJSONToServer({
    data: response.data,
    nonce: dcapiOptions.digital.requests[0].data.nonce,
  });
}

/** Server */
const { data, nonce } = getJSONFromBrowser(req);

const verified = await verifyPresentationResponse({
  data,
  nonce,
  expectedOrigin: 'http://localhost:8000',
  serverAESKeySecret,
});
```

`verified.credential1.claims` will contain any verified claims contained in the presented
credential.

## Example Presentation Requests

This library offers a respectable amount of flexibility to define desired claims when requesting an
mdoc or SD-JWT-VC presentation. See below for some ideas of values suitable as `credentialOptions`
when calling `generatePresentationRequest()`:

```ts
import type {
  OID4VPMDLCredentialOptions,
  OID4VPMdocCredentialOptionsFull,
  OID4VPMdocCredentialOptionsSimple,
  OID4VPSDJWTVCCredentialOptions,
} from '@simpledigicreds/server';
```

```ts
// A streamlined mDL request
const mdlRequest: OID4VPMDLCredentialOptions = {
  format: 'mdl',
  desiredClaims: ['family_name', 'given_name'],
};
```

```ts
// A simple European PID mdoc request
const mdocPIDRequest: OID4VPMdocCredentialOptionsSimple = {
  format: 'mdoc',
  doctype: 'eu.europa.ec.eudi.pid.1',
  claimPathPrefix: 'eu.europa.ec.eudi.pid.1',
  desiredClaims: ['family_name', 'given_name', 'nationality'],
};
```

```ts
// A simple EMVCo payment card mdoc request
const mdocEMVCORequest: OID4VPMdocCredentialOptionsSimple = {
  format: 'mdoc',
  doctype: 'com.emvco.payment_card',
  claimPathPrefix: 'com.emvco.payment_card.1',
  desiredClaims: ['card_number', 'card_network', 'expiry_year', 'expiry_month'],
};
```

```ts
// A simple mVRC mdoc request
const mdocMVRCRequest: OID4VPMdocCredentialOptionsSimple = {
  format: 'mdoc',
  doctype: 'org.iso.7367.1.mVRC',
  claimPathPrefix: 'org.iso.18013.5.1',
  desiredClaims: ['registration_number', 'date_of_registration', 'vehicle_holder'],
};
```

```ts
// An mdoc request with claims across multiple namespaces
const mdocRequestFull: OID4VPMdocCredentialOptionsFull = {
  format: 'mdoc',
  doctype: 'org.iso.7367.1.mVRC',
  desiredClaims: [
    ['org.iso.23220.1', 'issue_date'],
    ['org.iso.23220.1', 'issuing_authority_unicode'],
    ['org.iso.7367.1', 'vehicle_holder'],
    ['org.iso.7367.1', 'registration_number'],
  ],
};
```

```ts
// A simple European PID SD-JWT-VC request
const sdjwtvcRequest: OID4VPSDJWTVCCredentialOptions = {
  format: 'sd-jwt-vc',
  desiredClaims: ['family_name', 'given_name'],
  acceptedVCTValues: ['urn:eu.europa.ec.eudi:pid:1', 'urn:eudi:pid:1'],
};
```

```ts
// A more complex SD-JWT-VC request with a mix of single-path and multi-path claims
const sdjwtvcRequestComplex: OID4VPSDJWTVCCredentialOptions = {
  format: 'sd-jwt-vc',
  desiredClaims: [
    'given_name',
    'family_name',
    ['age_equal_or_over', '18'],
  ],
  acceptedVCTValues: ['urn:eudi:pid:1'],
};
```
