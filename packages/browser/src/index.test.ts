import { assertExists } from "@std/assert";

import { helloSimpleDigiCreds } from "./index.ts";

Deno.test("exports helloSimpleDigiCreds", () => {
  assertExists(helloSimpleDigiCreds);
});
