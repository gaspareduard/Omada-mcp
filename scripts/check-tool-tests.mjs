#!/usr/bin/env node
/**
 * check-tool-tests.mjs
 *
 * Enforces strict 1:1 test file mirroring (Option B):
 *   - Every src/tools/<name>.ts (except index.ts and types.ts) must have tests/tools/<name>.test.ts
 *   - Every src/omadaClient/<name>.ts (except index.ts) must have tests/omadaClient/<name>.test.ts
 *
 * This replaced Option A ("tool referenced somewhere in tests") after issue #57
 * migrated all bulk test files to per-tool test files.
 */

import { existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const root = resolve(import.meta.dirname, '..');

let failed = false;

// --- 1. src/tools/<name>.ts → tests/tools/<name>.test.ts ---

const toolsDir = join(root, 'src', 'tools');
const toolTestsDir = join(root, 'tests', 'tools');

const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && f !== 'types.ts');

const missingToolTests = [];
for (const file of toolFiles) {
    const testFile = file.replace(/\.ts$/, '.test.ts');
    if (!existsSync(join(toolTestsDir, testFile))) {
        missingToolTests.push({ src: `src/tools/${file}`, expected: `tests/tools/${testFile}` });
    }
}

if (missingToolTests.length > 0) {
    console.error(`\n❌ ${missingToolTests.length} tool file(s) missing a 1:1 test file:\n`);
    for (const { src, expected } of missingToolTests) {
        console.error(`  ${src}  →  ${expected} (missing)`);
    }
    failed = true;
} else {
    console.log(`✅ All ${toolFiles.length} tool files have a matching test file (tests/tools/).`);
}

// --- 2. src/omadaClient/<name>.ts → tests/omadaClient/<name>.test.ts ---

const clientDir = join(root, 'src', 'omadaClient');
const clientTestsDir = join(root, 'tests', 'omadaClient');

const clientFiles = readdirSync(clientDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts');

const missingClientTests = [];
for (const file of clientFiles) {
    const testFile = file.replace(/\.ts$/, '.test.ts');
    if (!existsSync(join(clientTestsDir, testFile))) {
        missingClientTests.push({ src: `src/omadaClient/${file}`, expected: `tests/omadaClient/${testFile}` });
    }
}

if (missingClientTests.length > 0) {
    console.error(`\n❌ ${missingClientTests.length} omadaClient file(s) missing a 1:1 test file:\n`);
    for (const { src, expected } of missingClientTests) {
        console.error(`  ${src}  →  ${expected} (missing)`);
    }
    failed = true;
} else {
    console.log(`✅ All ${clientFiles.length} omadaClient files have a matching test file (tests/omadaClient/).`);
}

if (failed) {
    console.error('\nEvery source file must have a 1:1 matching test file.');
    console.error('See CLAUDE.md — Testing section for the test strategy.\n');
    process.exit(1);
}
