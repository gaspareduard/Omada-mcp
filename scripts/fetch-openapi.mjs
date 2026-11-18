#!/usr/bin/env node
/**
 * fetch-openapi.mjs
 *
 * Refreshes docs/openapi/ from a controller's own springdoc endpoint so the
 * checked-in reference matches a specific Omada controller release.
 *
 *   node scripts/fetch-openapi.mjs https://omada-lab.example:8043 [--insecure]
 *
 * Use a disposable lab controller. The endpoint needs no credentials, but the
 * controller's address appears in the generated documents, so every occurrence
 * of the source origin is replaced with https://controller.example.com before
 * anything is written. Group files are named after their swagger-config group
 * ("04.1 Site Network Setting-Authentication" -> 04.1-site-network-setting-authentication.json).
 *
 * --insecure skips TLS verification for a lab controller's self-signed
 * certificate; prefer NODE_EXTRA_CA_CERTS when its CA is available. Behind an
 * egress proxy, run with NODE_USE_ENV_PROXY=1 so fetch() honours HTTPS_PROXY.
 *
 * The previous docs/openapi/*.json files are removed first, so groups TP-Link
 * dropped or renamed do not linger. Review the diff, then run
 * `node scripts/generate-request-schemas.mjs` and the route tests.
 */

import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PLACEHOLDER = 'https://controller.example.com';
const root = resolve(import.meta.dirname, '..');
const outDir = join(root, 'docs', 'openapi');

const args = process.argv.slice(2);
const insecure = args.includes('--insecure');
const base = args.find((arg) => !arg.startsWith('--'));
if (!base) {
    console.error('Usage: node scripts/fetch-openapi.mjs <controller-base-url> [--insecure]');
    process.exit(2);
}
const origin = new URL(base).origin;
// Scoped to this short-lived script process: fetch() has no per-request TLS option.
if (insecure) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function fileNameFor(group) {
    return `${group
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/^-+|-+$/g, '')}.json`;
}

async function getText(path) {
    const url = new URL(path, origin);
    const response = await fetch(url, { signal: AbortSignal.timeout(300_000) });
    if (!response.ok) throw new Error(`${url.pathname}: HTTP ${response.status}`);
    return await response.text();
}

function sanitize(text) {
    return text.split(origin).join(PLACEHOLDER);
}

const info = JSON.parse(await getText('/api/info')).result ?? {};
const config = JSON.parse(await getText('/v3/api-docs/swagger-config'));
const groups = config.urls.map((entry) => entry.name);
const documents = [];
for (const group of groups) {
    const text = sanitize(await getText(`/v3/api-docs/${encodeURIComponent(group)}`));
    const spec = JSON.parse(text);
    if (!spec.paths) throw new Error(`${group}: response has no paths`);
    documents.push({ file: fileNameFor(group), text });
    console.log(`${fileNameFor(group)}: ${Object.keys(spec.paths).length} paths`);
}

mkdirSync(outDir, { recursive: true });
for (const name of readdirSync(outDir)) {
    if (name.endsWith('.json')) rmSync(join(outDir, name));
}
for (const { file, text } of documents) writeFileSync(join(outDir, file), text);

const swaggerConfig = {
    configUrl: 'swagger-config',
    oauth2RedirectUrl: `${PLACEHOLDER}/swagger-ui/oauth2-redirect.html`,
    showExtensions: true,
    urls: groups.map((group) => ({ url: group, name: fileNameFor(group) })),
    validatorUrl: '',
};
writeFileSync(join(outDir, 'swagger-config.json'), `${JSON.stringify(swaggerConfig, null, 4)}\n`);
const source = {
    controllerVersion: info.controllerVer ?? 'unknown',
    apiVersion: info.apiVer ?? 'unknown',
    fetchedAt: new Date().toISOString().slice(0, 10),
};
writeFileSync(join(outDir, 'source.json'), `${JSON.stringify(source, null, 4)}\n`);
console.log(`Wrote ${documents.length} group documents, swagger-config.json and source.json (controller ${source.controllerVersion}) to ${outDir}`);
