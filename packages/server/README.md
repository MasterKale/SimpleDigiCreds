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

The simplest way to get started is to import methods required for generating options, then parsing a
presentation:

```ts
import { generatePresentationOptions, verifyPresentationResponse } from '@simpledigicreds/server';

/* server */
const options = await generateRequestOptions({
  desiredClaims: ['family_name', 'given_name'],
  requestOrigin: 'http://localhost:8000',
});

/* browser */
if (typeof window.DigitalCredential === 'function') {
  const response = await navigator.credentials.get(options);
}

/* server */
const verified = await verifyPresentationResponse({
  response: response.data,
  options,
});
```

The output of `verifyPresentationResponse()` will contain any verified claims contained in the
presented credential.
