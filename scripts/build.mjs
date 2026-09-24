// Build the src/ TypeScript sources into a single browser-ready bundle.
// Produces dist/glossarizer.js (readable, sourcemapped) and
// dist/glossarizer.min.js (minified) — either can be dropped into a page
// in place of the old script.js + glossarizer.js pair.
import "dotenv/config"; // loads .env into process.env, if present
import * as esbuild from "esbuild";
import { mkdirSync, rmSync } from "node:fs";

const outDir = "dist";
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const isWatch = process.argv.includes("--watch");

// API_HOST is baked into the bundle at build time (esbuild `define` replaces
// the `process.env.API_HOST` text — there is no real `process` at runtime in
// the browser). Set API_HOST in a local .env file to point a dev build at a
// local API server, e.g. API_HOST=http://localhost:5000
const apiHost = process.env.API_HOST || "https://commons.libretexts.org";

const baseOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "iife",
  target: ["es2018"],
  sourcemap: true,
  logLevel: "info",
  define: {
    "process.env.API_HOST": JSON.stringify(apiHost),
  },
};

if (isWatch) {
  const ctx = await esbuild.context({
    ...baseOptions,
    outfile: `${outDir}/glossarizer.js`,
  });
  await ctx.watch();
  console.log("[glossarizer] watching for changes...");
} else {
  await esbuild.build({
    ...baseOptions,
    outfile: `${outDir}/glossarizer.js`,
    minify: false,
  });
  await esbuild.build({
    ...baseOptions,
    outfile: `${outDir}/glossarizer.min.js`,
    minify: true,
  });
  console.log("[glossarizer] build complete -> dist/glossarizer.js, dist/glossarizer.min.js");
}
