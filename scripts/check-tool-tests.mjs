#!/usr/bin/env node
/**
 * check-tool-tests.mjs
 *
 * Validates that every registered MCP tool has at least one test covering it.
 * Scans all test files under tests/ for references to each tool name.
 *
 * This enforces Option A: "every tool must be tested somewhere".
 * Option B (strict 1:1 file mirroring) will be enforced after issue #57
 * migrates bulk test files to per-tool test files.
 */

import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const root = resolve(import.meta.dirname, '..');
const toolsDir = join(root, 'src', 'tools');
const testsDir = join(root, 'tests');

// Extract tool name from registerTool() call
function extractToolName(content) {
    const match = content.match(/server\.registerTool\(\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
}

// Recursively collect all test file contents
function collectTestContents(dir) {
    let contents = '';
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            contents += collectTestContents(full);
        } else if (entry.name.endsWith('.test.ts')) {
            contents += readFileSync(full, 'utf8');
        }
    }
    return contents;
}

const testContents = collectTestContents(testsDir);

const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts');

const missing = [];
let verifiedToolCount = 0;

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const file of toolFiles) {
    const content = readFileSync(join(toolsDir, file), 'utf8');
    const toolName = extractToolName(content);
    if (!toolName) continue; // skip non-tool files

    verifiedToolCount += 1;

    // Use word-boundary match to avoid false positives (e.g. getClient vs getClientDetail)
    const pattern = new RegExp(`\\b${escapeRegExp(toolName)}\\b`, 'm');
    if (!pattern.test(testContents)) {
        missing.push({ file, toolName });
    }
}

if (missing.length > 0) {
    console.error(`\n❌ ${missing.length} tool(s) have no test coverage:\n`);
    for (const { file, toolName } of missing) {
        console.error(`  ${toolName}  (src/tools/${file})`);
    }
    console.error('\nEvery registered tool must be referenced in at least one test file.');
    console.error('See CLAUDE.md — Testing section for the test strategy.\n');
    process.exit(1);
} else {
    console.log(`✅ All ${verifiedToolCount} tools have test coverage.`);
}
