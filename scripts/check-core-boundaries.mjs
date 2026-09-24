// Enforces the Core Isolation Rule (root CLAUDE.md): src/core/ must never
// import from src/modules/. Scans every .ts/.tsx file under src/core/ for an
// import/export/require specifier referencing @/modules/, ../modules/, or
// /modules/, and fails with the offending file:line if any are found.
//
//   node scripts/check-core-boundaries.mjs

import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const CORE_DIR = join(process.cwd(), "src", "core");
const VIOLATION_PATTERNS = [/@\/modules\//, /\.\.\/modules\//, /\/modules\//];
const IMPORT_KEYWORD_RE = /\b(?:import|export|require)\b/;
const QUOTED_STRING_RE = /['"]([^'"]+)['"]/g;

function collectSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (entry.isFile() && (extname(entry.name) === ".ts" || extname(entry.name) === ".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

function findViolations(filePath) {
  const violations = [];
  const lines = readFileSync(filePath, "utf8").split("\n");

  lines.forEach((line, index) => {
    if (!IMPORT_KEYWORD_RE.test(line)) return;

    QUOTED_STRING_RE.lastIndex = 0;
    let match;
    while ((match = QUOTED_STRING_RE.exec(line)) !== null) {
      const specifier = match[1];
      if (VIOLATION_PATTERNS.some((pattern) => pattern.test(specifier))) {
        violations.push({ line: index + 1, specifier });
      }
    }
  });

  return violations;
}

function main() {
  const files = collectSourceFiles(CORE_DIR);
  let hasViolations = false;

  for (const file of files) {
    for (const violation of findViolations(file)) {
      hasViolations = true;
      console.error(`${relative(process.cwd(), file)}:${violation.line} — forbidden import "${violation.specifier}"`);
    }
  }

  if (hasViolations) {
    console.error("\n✗ Core boundary check failed: found @/modules imports inside src/core");
    process.exit(1);
  }

  console.log("✓ Core boundary check passed: Zero @/modules imports in src/core");
  process.exit(0);
}

main();
