import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { FLOES_EDITORIAL_PRODUCT_IMAGES, editorialImagesForProduct, hasEditorialImagesForColor } from "../src/data/editorialProductImages.ts";

test("model photos are mapped as general galleries and never claimed as color-specific", () => {
  const daniela = editorialImagesForProduct("daniela");
  assert.equal(daniela.length, 3);
  assert.equal(editorialImagesForProduct("daniela", "Vino").length, 3);
  assert.deepEqual(editorialImagesForProduct("daniela", "Vino"), daniela);
  assert.equal(hasEditorialImagesForColor("daniela", "Vino"), false);
  assert.equal(editorialImagesForProduct("girasol").length, 6);
  assert.equal(editorialImagesForProduct("elite").length, 3);
});

test("all 39 optimized model photo paths exist under the separate editorial directory", () => {
  const paths = Object.values(FLOES_EDITORIAL_PRODUCT_IMAGES).flatMap((set) => set.default ?? []);
  assert.equal(paths.length, 39);
  assert.ok(paths.every((path) => existsSync(resolve(process.cwd(), "public", `.${path}`))));
  assert.ok(paths.every((path) => path.startsWith("/images/editorial/modelos/")));
});
