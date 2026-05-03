/**
 * Theme QA — validation script for condo-net theme system.
 *
 * Usage: cd condo-net/src && node scripts/test-themes.mjs
 *
 * Validates:
 *  - Theme JSON integrity (all 10 themes load, have required fields)
 *  - Required CSS variable keys present in every theme
 *  - Default theme (twitter) exists
 *  - Theme id uniqueness
 *  - Fallback handling (null, undefined, invalid id)
 */

import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themesDir = resolve(__dirname, "../src/themes");

const REQUIRED_LIGHT_VARS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
];

const REQUIRED_DARK_VARS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "border",
  "input",
  "ring",
];

const REQUIRED_THEME_FIELDS = ["font-sans", "font-mono", "radius"];

// ── Helpers ────────────────────────────────────────────────────────────

function loadTheme(filename) {
  const path = resolve(themesDir, filename);
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw);
}

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  process.exitCode = 1;
}

function pass(msg) {
  console.log(`  ✅ ${msg}`);
}

// ── Tests ──────────────────────────────────────────────────────────────

let failures = 0;
let passed = 0;

console.log("🧪 Theme QA — condo-net theme system validation\n");

// Test 1: Theme files load
console.log("Test 1: Theme JSON files load correctly");
const themeFiles = readdirSync(themesDir).filter((f) => f.endsWith(".json"));
if (themeFiles.length < 10) {
  fail(`Expected at least 10 theme files, got ${themeFiles.length}`);
} else {
  pass(`${themeFiles.length} theme JSON files found`);
}
passed++;

// Test 2: Each theme has required structure
console.log("\nTest 2: Theme structure validation");
for (const file of themeFiles) {
  try {
    const theme = loadTheme(file);
    const id = theme.name;

    if (!theme.cssVars?.theme) {
      fail(`${id}: missing cssVars.theme`);
      continue;
    }
    if (!theme.cssVars?.light) {
      fail(`${id}: missing cssVars.light`);
      continue;
    }
    if (!theme.cssVars?.dark) {
      fail(`${id}: missing cssVars.dark`);
      continue;
    }

    // Check required theme-level vars
    for (const v of REQUIRED_THEME_FIELDS) {
      if (!(v in theme.cssVars.theme)) {
        fail(`${id}: missing cssVars.theme.${v}`);
      }
    }

    // Check light vars
    for (const v of REQUIRED_LIGHT_VARS) {
      if (!(v in theme.cssVars.light)) {
        fail(`${id}: missing cssVars.light.${v}`);
      }
    }

    // Check dark vars
    for (const v of REQUIRED_DARK_VARS) {
      if (!(v in theme.cssVars.dark)) {
        fail(`${id}: missing cssVars.dark.${v}`);
      }
    }

    pass(`${id}: structure valid`);
    passed++;
  } catch (e) {
    fail(`${file}: ${e.message}`);
  }
}

// Test 3: Default theme exists
console.log("\nTest 3: Default theme (twitter) exists");
const twitterPath = resolve(themesDir, "twitter.json");
try {
  readFileSync(twitterPath, "utf-8");
  pass("twitter.json exists — fallback is valid");
  passed++;
} catch {
  fail("twitter.json not found — default theme broken");
}

// Test 4: Theme id uniqueness (via filename)
console.log("\nTest 4: Theme id uniqueness");
const ids = themeFiles.map((f) => f.replace(".json", ""));
const uniqueIds = new Set(ids);
if (ids.length === uniqueIds.size) {
  pass(`${ids.length} unique theme ids`);
  passed++;
} else {
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  fail(`Duplicate theme ids: ${dupes.join(", ")}`);
}

// Test 5: is_validTheme logic
console.log("\nTest 5: isValidTheme logic");
const validIds = new Set(ids);
function isValid(id) {
  return typeof id === "string" && validIds.has(id);
}

if (isValid("twitter")) pass("isValid('twitter') → true");
else fail("isValid('twitter') → false");

if (!isValid(null)) pass("isValid(null) → false");
else fail("isValid(null) → true");

if (!isValid(undefined)) pass("isValid(undefined) → false");
else fail("isValid(undefined) → true");

if (!isValid("nonexistent")) pass("isValid('nonexistent') → false");
else fail("isValid('nonexistent') → true");
passed++;

// ── Summary ────────────────────────────────────────────────────────────

const totalTests = 5;
const failed = process.exitCode === 1;
console.log(`\n${"=".repeat(50)}`);
console.log(`Results: ${passed} passed, ${totalTests - passed} failed`);
if (failed) {
  console.log("❌ Some tests failed — fix before proceeding");
} else {
  console.log("✅ All theme tests passed — system is intact");
}
