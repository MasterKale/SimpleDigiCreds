import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import {
  CredentialRequestOptions,
  generatePresentationOptions,
  verifyPresentationResponse,
} from "../packages/server/src/index.ts";

let currentOptions: CredentialRequestOptions;

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));
app.get("/", serveStatic({ path: "./static/index.html" }));

app.get("/options", async (ctx) => {
  const mdlOptions = await generatePresentationOptions({
    credentialFormat: "mdl",
    desiredClaims: ["family_name", "given_name"],
    requestOrigin: "http://localhost:8000",
  });

  const sdjwtOptions = await generatePresentationOptions({
    credentialFormat: "sd-jwt",
    acceptedVCTValues: ["urn:eu.europa.ec.eudi:pid:1"],
    desiredClaims: ["family_name", "given_name"],
    requestOrigin: "http://localhost:8000",
  });

  /**
   * Toggle between these to test either format (until both can be included in one DC API call)
   */
  // const options = mdlOptions;
  const options = sdjwtOptions;

  console.log(JSON.stringify(options, null, 2));

  currentOptions = options;

  return ctx.json(options);
});

app.post("/verify", async (ctx) => {
  const body = await ctx.req.json();

  console.log("verifying presentation", body);

  const verified = await verifyPresentationResponse({
    response: body,
    options: currentOptions,
  });

  console.log("verified claims:\n", JSON.stringify(verified, null, 2));

  return ctx.json({ verified });
});

Deno.serve({ hostname: "localhost" }, app.fetch);
