import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";

// Compile domain tests with the project's TypeScript; no extra test dependency.
const output = path.resolve("node_modules/.tmp/domain-tests");
const files = [];
const excludedSuites = new Set([
  // Legacy suite for the pre-Firebase synchronous demo stores. It references
  // removed DGNG demo products and APIs such as orderStore.addOrder().
  "tests/operations.test.ts",
]);
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(name);
    else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) files.push(name);
  }
}
collect("src");
collect("tests");
for (const file of files) {
  const result = ts
    .transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2023,
        module: ts.ModuleKind.ESNext,
      },
    })
    .outputText
    .replace(
      /import\.meta\.env/g,
      `({ VITE_FIREBASE_API_KEY: "test-api-key", VITE_FIREBASE_AUTH_DOMAIN: "test.firebaseapp.com", VITE_FIREBASE_PROJECT_ID: "test-project", VITE_FIREBASE_STORAGE_BUCKET: "test.appspot.com", VITE_FIREBASE_MESSAGING_SENDER_ID: "1", VITE_FIREBASE_APP_ID: "1:test:web:test", VITE_FIREBASE_MEASUREMENT_ID: "G-TEST" })`,
    )
    .replace(
      /(from\s*["']|import\s*["'])(\.[^"']+)(["'])/g,
      (_, start, specifier, end) =>
        `${start}${specifier.replace(/\.ts$/, "")}.mjs${end}`,
    );
  const destination = path.join(output, file.replace(/\.ts$/, ".mjs"));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, result);
}
const test = spawnSync(
  process.execPath,
  [
    "--test",
    ...files
      .filter((file) => file.startsWith("tests") && file.endsWith(".test.ts"))
      .filter((file) => !excludedSuites.has(file.replaceAll("\\", "/")))
      .map((file) => path.join(output, file.replace(/\.ts$/, ".mjs"))),
  ],
  { stdio: "inherit" },
);
for (const suite of excludedSuites) {
  console.warn(`SKIP ${suite}: suite legacy no compatible con los stores Firebase actuales.`);
}
process.exitCode = test.status ?? 1;
