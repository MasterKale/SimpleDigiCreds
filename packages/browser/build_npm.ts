import { build, emptyDir } from "@deno/dnt";

import denoJSON from "./deno.json" with { type: "json" };

const outDir = "./npm";

await emptyDir(outDir);

await build({
  entryPoints: [
    denoJSON.exports,
  ],
  outDir,
  importMap: "./deno.json",
  shims: {
    deno: {
      test: "dev",
    },
  },
  // TODO: Re-enable if https://github.com/denoland/dnt/issues/331 can get resolved
  typeCheck: false,
  // TODO: Re-enable if https://github.com/denoland/dnt/issues/430 can get resolved
  test: false,
  // package.json values
  package: {
    name: denoJSON.name,
    version: denoJSON.version,
    description:
      "Part of a collection of TypeScript-first libraries for simpler Digital Credential presentation and verification. Pairs with @simpledigicreds/server",
    license: "MIT",
    author: "Matthew Miller <matthew@millerti.me>",
    repository: {
      type: "git",
      url: "git+https://github.com/MasterKale/SimpleDigiCreds.git",
      directory: "packages/browser",
    },
    homepage: "https://github.com/MasterKale/SimpleDigiCreds/tree/main/packages/browser#readme",
    publishConfig: {
      access: "public",
    },
    engines: {
      node: ">=22.0.0",
    },
    bugs: {
      url: "https://github.com/MasterKale/SimpleDigiCreds/issues",
    },
    keywords: [
      "typescript",
      "digital credentials",
      "browser",
    ],
    dependencies: {},
  },
  // Map from Deno package to NPM package for Node build
  mappings: {},
  // TypeScript tsconfig.json config
  compilerOptions: {
    lib: ["ES2023", "DOM"],
    target: "ES2023",
  },
});

Deno.copyFileSync("LICENSE.md", `${outDir}/LICENSE.md`);
Deno.copyFileSync("README.md", `${outDir}/README.md`);
