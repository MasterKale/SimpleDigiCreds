# @simpledigicreds/server <!-- omit in toc -->

Part of a collection of TypeScript-first libraries for simpler Digital Credential presentation and
verification.

- [Installation](#installation)
  - [Node LTS 22.x and higher](#node-lts-22x-and-higher)
  - [Deno 2.1 and higher](#deno-21-and-higher)
- [Usage](#usage)

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

`verified.cred1.claims` will contain any verified claims contained in the presented credential.
