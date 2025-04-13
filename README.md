# SimpleDigiCreds <!-- omit in toc -->

- [Overview](#overview)
- [Installation](#installation)
- [Contributions](#contributions)
- [Example Site](#example-site)
- [Development](#development)

## Overview

This project makes it easier to combine **OID4VP (draft 24) + mdoc** for meaningful identity
proofing via the [Digital Credentials API](https://wicg.github.io/digital-credentials/). The
following packages are maintained here to achieve this:

- [@simpledigicreds/browser](https://github.com/MasterKale/SimpleDigiCreds/tree/main/packages/browser)
- [@simpledigicreds/server](https://github.com/MasterKale/SimpleDigiCreds/tree/main/packages/server)

## Installation

SimpleDigiCreds can be installed from **[NPM](https://www.npmjs.com/search?q=%40simpledigicreds)**
and **[JSR](https://jsr.io/@simpledigicreds)** in **Node LTS 22.x and higher**, **Deno 2.1 and
higher** projects, and other compatible runtimes (Cloudflare Workers, Bun, etc...)

See the packages' READMEs for more specific installation information.

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
