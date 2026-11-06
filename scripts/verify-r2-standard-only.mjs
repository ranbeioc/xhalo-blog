#!/usr/bin/env node
// R2 must stay in Standard storage. Infrequent Access bills its Class A operations (a write, or a lifecycle
// transition) with no free tier, rounded up to a whole million: one transition in a month costs $9 (it happened:
// 2026-11, 128 transitions of 36 KB). Its reads add Class B ($0.90) and retrieval fees. Retention is "delete after N
// days" only — never "move to Infrequent Access".
//
// Fails when tracked source or config writes objects in Infrequent Access or declares a storage-class transition.
// The account-wide check of the live buckets is the `r2.ia_operations` quota (xhalo-admin cost collector).
// A line that must mention it for another reason (reading analytics, say) can carry the marker `r2-ia-allow`.
//
//   node scripts/verify-r2-standard-only.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SELF = "scripts/verify-r2-standard-only.mjs";
const CHECKED = /\.(m?[jt]sx?|cjs|py|json|jsonc|toml|ya?ml|sh|ps1)$/i;
const SKIPPED = /(^|\/)(node_modules|dist|build|out|\.next|\.wrangler|coverage|vendor)\/|\.d\.ts$|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/;
const RULES = [
  [/storageClass\s*[:=]\s*["'`]InfrequentAccess/i, "an object written with storageClass InfrequentAccess"],
  [/["'`]InfrequentAccess["'`]/, "the InfrequentAccess storage class as a value"],
  [/STANDARD_IA\b/, "an S3 STANDARD_IA storage class"],
  [/storageClassTransitions|storage_class_transitions/i, "an R2 lifecycle storage-class transition"],
  [/--storage-class[=\s]+["']?InfrequentAccess/i, "wrangler --storage-class InfrequentAccess"],
  [/(cf-r2|x-amz)-storage-class["']?\s*[:=]\s*["'`]?(InfrequentAccess|STANDARD_IA)/i, "a storage-class request header for Infrequent Access"],
  [/--transition-days|transitionDays|ia-transition/i, "an R2 lifecycle transition setting"],
];

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\0")
  .filter((file) => file && file !== SELF && CHECKED.test(file) && !SKIPPED.test(file));
const failures = [];
for (const file of files) {
  let text;
  try { text = readFileSync(file, "utf8"); } catch { continue; }
  if (text.length > 4 * 1024 * 1024) continue;
  text.split(/\r?\n/).forEach((line, index) => {
    if (line.includes("r2-ia-allow")) return;
    for (const [pattern, what] of RULES) if (pattern.test(line)) failures.push(`${file}:${index + 1}: ${what}\n    ${line.trim().slice(0, 160)}`);
  });
}
if (failures.length) {
  console.error(`R2 must stay in Standard storage (Infrequent Access writes/transitions bill a whole million at a time):\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`R2 Standard-only check passed (${files.length} tracked files).`);
