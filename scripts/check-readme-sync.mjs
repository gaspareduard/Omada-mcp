#!/usr/bin/env node
/**
 * check-readme-sync.mjs
 *
 * Validates that every registered MCP tool has a corresponding entry
 * in both README.md and README.Docker.md.
 *
 * Fails the build if any tool is missing from either file.
 */

import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';

const root = resolve(import.meta.dirname, '..');
const toolsDir = join(root, 'src', 'tools');

function extractToolName(content) {
    const match = content.match(/server\.registerTool\(\s*['"]([^'"]+)['"]/);
    return match ? match[1] : null;
}

function extractReadmeTools(content) {
    const tools = new Set();
    for (const match of content.matchAll(/^\| `([^`]+)` \|/gm)) {
        tools.add(match[1]);
    }
    return tools;
}

const readmeMd = readFileSync(join(root, 'README.md'), 'utf8');
const readmeDockerMd = readFileSync(join(root, 'README.Docker.md'), 'utf8');

const readmeTools = extractReadmeTools(readmeMd);
const dockerReadmeTools = extractReadmeTools(readmeDockerMd);

const toolFiles = readdirSync(toolsDir).filter((f) => f.endsWith('.ts') && f !== 'index.ts');

const missingReadme = [];
const missingDockerReadme = [];

let verifiedToolCount = 0;

for (const file of toolFiles) {
    const content = readFileSync(join(toolsDir, file), 'utf8');
    const toolName = extractToolName(content);
    if (!toolName) continue;

    verifiedToolCount += 1;

    if (!readmeTools.has(toolName)) missingReadme.push(toolName);
    if (!dockerReadmeTools.has(toolName)) missingDockerReadme.push(toolName);
}

let failed = false;

if (missingReadme.length > 0) {
    console.error(`\n❌ ${missingReadme.length} tool(s) missing from README.md:\n`);
    for (const t of missingReadme) console.error(`  ${t}`);
    failed = true;
}

if (missingDockerReadme.length > 0) {
    console.error(`\n❌ ${missingDockerReadme.length} tool(s) missing from README.Docker.md:\n`);
    for (const t of missingDockerReadme) console.error(`  ${t}`);
    failed = true;
}

if (failed) {
    console.error('\nEvery registered tool must have a row in both README.md and README.Docker.md.');
    console.error('See CLAUDE.md — Documentation Synchronization.\n');
    process.exit(1);
} else {
    console.log(`✅ All ${verifiedToolCount} tools are documented in README.md and README.Docker.md.`);
}
