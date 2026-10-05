import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = (file: string) => fs.readFileSync(file, "utf8");

test("accessible admin runtime does not mount Firebase product authority", () => {
  const layout = source("src/admin/layout/AdminLayout.tsx");
  const store = source("src/admin/pages/AdminStore.tsx");

  assert.equal(layout.includes("AdminProductBootstrap"), false);
  assert.equal(layout.includes("getRemoteProducts"), false);
  assert.equal(store.includes("useProductStore"), false);
});

test("legacy commercial metrics routes redirect to the Chopify-backed dashboard", () => {
  const app = source("src/App.tsx");

  for (const route of ["finanzas", "proyeccion", "analitica"]) {
    assert.equal(
      app.includes(`<Route path="${route}" element={<Navigate to="/admin" replace />} />`),
      true,
    );
  }
});

test("public catalog remains gated by the Chopify catalog bootstrap", () => {
  const layout = source("src/components/layout/StoreLayout.tsx");
  const bootstrap = source("src/components/products/ProductCatalogBootstrap.tsx");
  const catalog = source("src/services/chopify/catalog.ts");

  assert.equal(layout.includes("<ProductCatalogBootstrap>"), true);
  assert.equal(bootstrap.includes("fetchChopifyCatalog"), true);
  assert.equal(catalog.includes('fetch("/api/catalog"'), true);
});
