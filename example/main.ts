import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import { generateRequestOptions } from "../packages/server/src/index.ts";

const app = new Hono();

app.use("/static/*", serveStatic({ root: "./" }));
app.get("/", serveStatic({ path: "./static/index.html" }));

app.get("/options", async (ctx) => {
  const options = await generateRequestOptions({
    desiredClaims: ["family_name", "given_name"],
    requestOrigin: "http://localhost:8000",
  });

  console.log(JSON.stringify(options, null, 2));

  /**
   * This is an older format of the DC API call. We have to call it this way for now till a
   * future Chrome update (currently on Chrome Canary 134) adds support for the newer DC API
   * call structure
   */
  const _options = {
    digital: {
      providers: [{
        protocol: "openid4vp",
        request: options.digital.requests[0],
      }],
    },
  };

  return ctx.json(_options);
});

app.post("/verify", async (ctx) => {
  const body = await ctx.req.json();

  console.log("verifying presentation", body);

  return ctx.json({
    TODO: "this",
  });
});

Deno.serve({ hostname: "localhost" }, app.fetch);
