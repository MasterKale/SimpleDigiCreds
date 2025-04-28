# Changelog

## v0.5.0

- **[server]** Calls to `verifyPresentationResponse()` can now be stateless if the front end sends
  back the request nonce after verification
  ([#18](https://github.com/MasterKale/SimpleDigiCreds/pull/18))
- **[server]** `verifyPresentationResponse()` now returns claims as `verified.credential1` instead
  of `verified.cred1` ([#19](https://github.com/MasterKale/SimpleDigiCreds/pull/19))

## v0.4.0

- **[server]** Presentation requests can now be generated for mdoc credentials using different
  doctypes and more complex claim paths, and for SD-JWT-VC credentials with more complex paths
  ([#16](https://github.com/MasterKale/SimpleDigiCreds/pull/16))

## v0.3.0

- **[server]** Supports encrypted responses by default
  ([#14](https://github.com/MasterKale/SimpleDigiCreds/pull/14))

## v0.2.1

- **[server]** Change CBOR library source from JSR to NPM

## v0.2.0

- **[server]** Supports end-to-end OID4VP + SD-JWT-VC presentation request (unsigned) and
  verification (unencrypted) ([#10](https://github.com/MasterKale/SimpleDigiCreds/pull/10))
- **[server]** `generateRequestOptions()` has been renamted to `generatePresentationOptions()`, and
  `verifyResponse()` is now `verifyPresentationResponse()`
  ([#9](https://github.com/MasterKale/SimpleDigiCreds/pull/9))

## v0.1.0

- An example site can be started via `deno task example:start` to test out this project locally
- **[server]** Supports end-to-end OID4VP (draft 24) + mdoc presentation request (unsigned) and
  verification (unencrypted)

## v0.0.3

- **[server]** Export more types for better docs

## v0.0.2

- **[server]** Supports a wider range of mdoc claims

## v0.0.1

- **[server]** Supports requesting family name, given name, and whether over 21 years of age
- **[browser]** Fixed a typo

## v0.0.0

- **[browser, server]** Hello world
