import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import {
  GeneratedPresentationRequest,
  generatePresentationRequest,
  verifyPresentationResponse,
} from "../packages/server/src/index.ts";

let currentRequest: GeneratedPresentationRequest;

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));
app.get("/", serveStatic({ path: "./static/index.html" }));

app.get("/options", async (ctx) => {
  const mdlRequest = await generatePresentationRequest({
    credentialOptions: {
      format: "mdl",
      desiredClaims: ["family_name", "given_name"],
    },
    requestOrigin: "http://localhost:8000",
    encryptResponse: false,
  });

  const sdjwtvcRequest = await generatePresentationRequest({
    credentialOptions: {
      format: "sd-jwt-vc",
      desiredClaims: ["family_name", "given_name"],
      acceptedVCTValues: ["urn:eu.europa.ec.eudi:pid:1", "urn:eudi:pid:1"],
    },
    requestOrigin: "http://localhost:8000",
  });

  /**
   * Toggle between these to test either format (until both can be included in one DC API call)
   */
  // const _request = mdlRequest;
  const _request = sdjwtvcRequest;
  const { dcapiOptions } = _request;

  console.log(JSON.stringify(_request, null, 2));

  currentRequest = _request;

  return ctx.json(dcapiOptions);
});

app.post("/verify", async (ctx) => {
  const body = await ctx.req.json();

  console.log("verifying presentation", body);

  const verified = await verifyPresentationResponse({
    data: body,
    request: currentRequest,
  });

  console.log("verified claims:\n", JSON.stringify(verified, null, 2));

  return ctx.json({ verified });
});

Deno.serve({ hostname: "localhost" }, app.fetch);
