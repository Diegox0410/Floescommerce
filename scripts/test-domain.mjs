import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";

// Compile domain tests with the project's TypeScript; no extra test dependency.
const output = path.resolve("node_modules/.tmp/domain-tests");
const files = [];
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
    .outputText.replace(
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
      .map((file) => path.join(output, file.replace(/\.ts$/, ".mjs"))),
  ],
  { stdio: "inherit" },
);
process.exitCode = test.status ?? 1;
