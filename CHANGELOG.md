# Changelog

## v0.6.0

**@simpledigicreds/server** now
targets[OID4VP 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html) and
[OID4VC HAIP 1.0](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html)!
🎉

**This release contains breaking changes!** Read on to learn more.

- **[server]** Package support for OID4VP + HAIP has been updated to 1.0 for both
  ([#24](https://github.com/MasterKale/SimpleDigiCreds/pull/24))
- **[server]** `verifyPresentationResponse()` throws `SimpleDigiCredsError` when a response from a
  wallet contains an error responses ([#25](https://github.com/MasterKale/SimpleDigiCreds/pull/25))
- **[server]** `verifyPresentationResponse()` ensures that responses contain expected credential
  responses, and validates mdoc doctype or SD-JWT-VC vct values
  ([#26](https://github.com/MasterKale/SimpleDigiCreds/pull/26),
  [#29](https://github.com/MasterKale/SimpleDigiCreds/pull/29))
- **[server]** mdoc verification now throws instead of returning empty claims when verification
  fails ([#27](https://github.com/MasterKale/SimpleDigiCreds/pull/27))

### Breaking Changes

The biggest one is that nonces generated using `generatePresentationOptions()` in v0.5.0 won't be
usable with `verifyPresentationResponse()` in v0.6.0 due to the addition of new values in v0.6.0
nonces. Use of this library is basically none-existent for now, though, so I'm not offering a
migration path for now to keep project momentum moving forward.

Aside from this there are various smaller changes related to targeting OID4VP + HAIP 1.0 that may
prevent verifying responses from wallets targeting earlier pre-release versions of these
specifications.

At some point in the future I will be less cavalier about changes like this. But for now if you're
living on the cutting edge of identity standards and are impacted by these breaking changes, please
feel free to reach out via issue or email and let me know how you're using this project!

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
