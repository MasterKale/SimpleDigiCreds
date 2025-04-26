# SimpleDigiCreds <!-- omit in toc -->

- [Disclaimer](#disclaimer)
- [Overview](#overview)
- [Installation](#installation)
- [Supported Features](#supported-features)
  - [OID4VP - All doc formats](#oid4vp---all-doc-formats)
  - [OID4VP - SD-JWT-VC](#oid4vp---sd-jwt-vc)
- [Contributions](#contributions)
- [Example Site](#example-site)
- [Development](#development)

## Disclaimer

**THIS PROJECT IS A WIP RIGHT NOW! THE CORE API MAY CHANGE MORE QUICKLY THAN YOU LIKE!**

## Overview

This project makes it easier to request presentations of **ISO 18013-5 mDL** and **IETF SD-JWT-VC**
digital credentials using **OID4VP (draft 24)** via the
[Digital Credentials API](https://w3c-fedid.github.io/digital-credentials/). The following packages
are maintained here to achieve this:

- [@simpledigicreds/browser](https://github.com/MasterKale/SimpleDigiCreds/tree/main/packages/browser)
- [@simpledigicreds/server](https://github.com/MasterKale/SimpleDigiCreds/tree/main/packages/server)

## Installation

SimpleDigiCreds can be installed from **[NPM](https://www.npmjs.com/search?q=%40simpledigicreds)**
and **[JSR](https://jsr.io/@simpledigicreds)** in **Node LTS 22.x and higher**, **Deno 2.1 and
higher** projects, and other compatible runtimes (Cloudflare Workers, Bun, etc...)

See the packages' READMEs for more specific installation information.

## Supported Features

### OID4VP - All doc formats

- Unencrypted requests
- Unencrypted responses
- Encrypted responses (following
  [OID4VC HAIP](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0-03.html#section-6))

### OID4VP - SD-JWT-VC

- Key binding verification

## Contributions

The SimpleDigiCreds project is not currently open to external contributions.

Please [submit an Issue](https://github.com/MasterKale/SimpleDigiCreds/issues/new/choose) and fill
out the provided template with as much information as possible if you have found a bug in need of
fixing.

You can also [submit an Issue](https://github.com/MasterKale/SimpleDigiCreds/issues/new/choose) to
request new features, or to suggest changes to existing features.

## Example Site

An example site is included to help test credential presentation locally. Run the following command
locally to get started:

```sh
# Deno 2.1+
$> deno task example:start
```

The site will be available at http://localhost:4000 to test out SimpleDigiCreds and the Digital
Credentials API.

## Development

Install the following before proceeding:

- **Deno 2.1+**

After pulling down the code, set up dependencies:

```sh
$> deno install
```

To run unit tests for all workspace packages, use the `test` series of scripts:

```sh
# Run an individual package's tests
$> cd packages/browser/ && deno task test
$> cd packages/server/ && deno task test
```

Tests can be run in watch mode with the `test:watch` series of scripts:

```sh
$> cd packages/browser/ && deno task test:watch
$> cd packages/server/ && deno task test:watch
```
