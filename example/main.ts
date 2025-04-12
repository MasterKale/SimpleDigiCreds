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

  currentOptions = options;

  return ctx.json(options);
});

app.post("/verify", async (ctx) => {
  const body = await ctx.req.json();

  console.log("verifying presentation", body);

  return ctx.json({
    verified: "TODO",
  });
});

Deno.serve({ hostname: "localhost" }, app.fetch);
