import fs from "node:fs";
import path from "node:path";
import { assertOwnerPreviewArtifact, assertOwnerPreviewConfig } from "./owner-preview-build-check.mjs";

if (assertOwnerPreviewConfig(process.env)) {
  const assetsDirectory = path.resolve("dist/assets");
  const bundles = fs.readdirSync(assetsDirectory)
    .filter((name) => /^index-.*\.js$/.test(name))
    .map((name) => fs.readFileSync(path.join(assetsDirectory, name), "utf8"));
  if (!bundles.length) throw new Error("FLOES Owner Preview build did not emit the frontend bundle.");
  const valid = bundles.some((bundle) => {
    try {
      assertOwnerPreviewArtifact(process.env, bundle);
      return true;
    } catch {
      return false;
    }
  });
  if (!valid) throw new Error("FLOES Owner Preview build rejected: compiled Owner identity or Firebase Web SDK config did not match the sandbox Preview variables.");
  console.log("FLOES candidate Preview build check passed; compiled Owner identity and six Firebase Web SDK fields match the sandbox Preview configuration.");
}
