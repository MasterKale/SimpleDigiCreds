import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import {
  generatePresentationRequest,
  type OID4VPMDLCredentialOptions,
  type OID4VPMdocCredentialOptionsFull,
  type OID4VPMdocCredentialOptionsSimple,
  type OID4VPSDJWTVCCredentialOptions,
  verifyPresentationResponse,
} from "../packages/server/src/index.ts";

/**
 * NEVER USE THIS EXAMPLE SERVER KEY IN PRODUCTION!
 *
 * If you need to generate a new key, use the following command instead:
 *
 * ```ts
 * const serverAESKeySecret = globalThis.crypto.getRandomValues(new Uint8Array(32));
 * ```
 *
 * Then store `serverAESKeySecret` in a secure location (env var, etc...) and pass it in when
 * calling the `generatePresentationRequest()` and `verifyPresentationResponse()` methods.
 */
const serverAESKeySecret = new Uint8Array(32);

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));
app.get("/", serveStatic({ path: "./static/index.html" }));

app.get("/options", async (ctx) => {
  // A streamlined mDL request
  const mdlRequest: OID4VPMDLCredentialOptions = {
    format: "mdl",
    desiredClaims: ["family_name", "given_name"],
  };

  // A straightforward European PID mdoc request
  const mdocPIDRequest: OID4VPMdocCredentialOptionsSimple = {
    format: "mdoc",
    doctype: "eu.europa.ec.eudi.pid.1",
    claimPathPrefix: "eu.europa.ec.eudi.pid.1",
    desiredClaims: ["family_name", "given_name", "nationality"],
  };

  // A straightforward EMVCo payment card mdoc request
  const mdocEMVCORequest: OID4VPMdocCredentialOptionsSimple = {
    format: "mdoc",
    doctype: "com.emvco.payment_card",
    claimPathPrefix: "com.emvco.payment_card.1",
    desiredClaims: ["card_number", "card_network", "expiry_year", "expiry_month"],
  };

  // A straightforward mVRC mdoc request
  const mdocMVRCRequest: OID4VPMdocCredentialOptionsSimple = {
    format: "mdoc",
    doctype: "org.iso.7367.1.mVRC",
    claimPathPrefix: "org.iso.18013.5.1",
    desiredClaims: ["registration_number", "date_of_registration", "vehicle_holder"],
  };

  // An mdoc request with claims across multiple namespaces
  const mdocRequestFull: OID4VPMdocCredentialOptionsFull = {
    format: "mdoc",
    doctype: "org.iso.7367.1.mVRC",
    desiredClaims: [
      ["org.iso.23220.1", "issue_date"],
      ["org.iso.23220.1", "issuing_authority_unicode"],
      ["org.iso.7367.1", "vehicle_holder"],
      ["org.iso.7367.1", "registration_number"],
    ],
  };

  // A straightforward European PID SD-JWT-VC request
  const sdjwtvcRequest: OID4VPSDJWTVCCredentialOptions = {
    format: "sd-jwt-vc",
    desiredClaims: ["family_name", "given_name"],
    acceptedVCTValues: ["urn:eu.europa.ec.eudi:pid:1", "urn:eudi:pid:1"],
  };

  // A more complex SD-JWT-VC request with a mix of single-path and multi-path claims
  const sdjwtvcRequestComplex: OID4VPSDJWTVCCredentialOptions = {
    format: "sd-jwt-vc",
    desiredClaims: [
      "given_name",
      "family_name",
      ["age_equal_or_over", "18"],
    ],
    acceptedVCTValues: ["urn:eudi:pid:1"],
  };

  /**
   * Toggle between these to test either format (until both can be included in one DC API call)
   */
  const request = await generatePresentationRequest({
    credentialOptions: sdjwtvcRequestComplex,
    // encryptResponse: false, // Optional, defaults to `true`
    serverAESKeySecret,
  });

  console.log(JSON.stringify(request, null, 2));

  return ctx.json(request.dcapiOptions);
});

app.post("/verify", async (ctx) => {
  const body: { data: string; nonce: string } = await ctx.req.json();

  console.log("verifying presentation", body.data);
  console.log("nonce", body.nonce);

  const verified = await verifyPresentationResponse({
    data: body.data,
    nonce: body.nonce,
    expectedOrigin: "http://localhost:8000",
    serverAESKeySecret,
  });

  console.log("verified claims:\n", JSON.stringify(verified, null, 2));

  return ctx.json({ verified });
});

Deno.serve({ hostname: "localhost" }, app.fetch);
