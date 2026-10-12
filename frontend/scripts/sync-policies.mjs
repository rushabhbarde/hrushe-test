// Copies the store policies (lib/policies.ts) to the backend's copy that the help assistant
// reads (backend/src/data/policies.json). Run after editing a policy: npm run policies:sync
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, "../lib/policies.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleShim = { exports: {} };
new Function("module", "exports", compiled)(moduleShim, moduleShim.exports);

const target = path.join(here, "../../backend/src/data/policies.json");
fs.writeFileSync(target, `${JSON.stringify(moduleShim.exports.policyTabs, null, 2)}\n`);
console.log(`Synced ${moduleShim.exports.policyTabs.length} policies to ${path.relative(process.cwd(), target)}`);
