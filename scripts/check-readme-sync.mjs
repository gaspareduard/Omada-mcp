#!/usr/bin/env node
/** Verify documentation against the built runtime catalog, including discovery. Run after build. */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ALL_CATEGORIES } from '../dist/config.js';
import { registerAllTools } from '../dist/tools/index.js';

const root = resolve(import.meta.dirname, '..');
const permissions = new Map(ALL_CATEGORIES.map((category) => [category, new Set(['read', 'write'])]));
const names = new Set();
for (const catalogMode of ['standard', 'compact']) {
    const current = new Set();
    registerAllTools(
        {
            registerTool(name) {
                if (current.has(name)) throw new Error(`Duplicate runtime tool: ${name}`);
                current.add(name);
                names.add(name);
            },
        },
        {},
        permissions,
        { includeDeprecated: true, catalogMode }
    );
}
const declarations = new Map();
for (const relative of [
    ...readdirSync(join(root, 'src/tools'))
        .filter((name) => name.endsWith('.ts'))
        .map((name) => `src/tools/${name}`),
    'src/server/catalog.ts',
]) {
    const source = readFileSync(join(root, relative), 'utf8');
    for (const match of source.matchAll(/server\.registerTool\(\s*['"]([^'"]+)['"]/g)) {
        const name = match[1];
        if (declarations.has(name)) throw new Error(`Duplicate declaration: ${name} in ${relative} and ${declarations.get(name)}`);
        declarations.set(name, relative);
        if (!names.has(name)) throw new Error(`Unregistered tool declaration: ${name} in ${relative}`);
    }
}
for (const filename of ['README.md', 'README.Docker.md']) {
    const rows = new Set([...readFileSync(join(root, filename), 'utf8').matchAll(/^\| `([^`]+)` \|/gm)].map((match) => match[1]));
    const missing = [...names].filter((name) => !rows.has(name));
    if (missing.length) throw new Error(`${filename} missing tools: ${missing.join(', ')}`);
}
console.log(
    `All ${names.size} unique runtime tools (including optional aliases/recovery/compact dispatch) are documented in both READMEs; ${declarations.size} literal declarations checked.`
);
