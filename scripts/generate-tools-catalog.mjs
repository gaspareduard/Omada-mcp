#!/usr/bin/env node
/**
 * generate-tools-catalog.mjs
 *
 * Regenerates OMADA_TOOLS.md: one row per operation in the checked-in official
 * spec (docs/openapi/00-all.json), with its group file, a backlog category,
 * a suggested tool name and whether src/omadaClient already calls the route.
 *
 *   node scripts/generate-tools-catalog.mjs          # write OMADA_TOOLS.md
 *   node scripts/generate-tools-catalog.mjs --check  # fail if OMADA_TOOLS.md is stale
 *
 * Implementation status is derived statically from src/omadaClient: every
 * this.buildPath(...) template (with the HTTP helper that follows it) and the
 * site-scoped send()/list() helpers of siteConfig.ts. A bare `${identifier}`
 * segment that is not a URI-encoded parameter is treated as a wildcard that
 * may span several segments (switchPorts builds `ports/{port}/<operation>`).
 *
 * Categories and tool names already present in OMADA_TOOLS.md are preserved.
 * A new operation takes the category of the existing operation sharing the
 * longest path prefix (site-template and MSP routes are pinned), and a name
 * built from its HTTP verb and literal path segments.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const specDir = join(root, 'docs', 'openapi');
const outFile = join(root, 'OMADA_TOOLS.md');
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

const normalize = (path) => path.replace(/\{[^}]+\}/g, '{}');
const keyOf = (method, path) => `${method.toUpperCase()} ${normalize(path)}`;

// ---- spec operations -------------------------------------------------------

const groupFiles = readdirSync(specDir)
    .filter((name) => /^\d.*\.json$/.test(name) && name !== '00-all.json')
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const fileOf = new Map();
for (const file of groupFiles) {
    const spec = JSON.parse(readFileSync(join(specDir, file), 'utf8'));
    for (const [path, item] of Object.entries(spec.paths ?? {})) {
        for (const method of METHODS) {
            if (item[method] && !fileOf.has(keyOf(method, path))) fileOf.set(keyOf(method, path), file);
        }
    }
}

const all = JSON.parse(readFileSync(join(specDir, '00-all.json'), 'utf8'));
const operations = [];
for (const [path, item] of Object.entries(all.paths ?? {})) {
    for (const method of METHODS) {
        const op = item[method];
        if (!op) continue;
        operations.push({
            key: keyOf(method, path),
            method: method.toUpperCase(),
            path,
            summary: (op.summary ?? op.operationId ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim(),
            tag: op.tags?.[0] ?? 'untagged',
            file: fileOf.get(keyOf(method, path)) ?? '00-all.json',
            deprecated: op.deprecated === true,
        });
    }
}

// ---- implemented routes ----------------------------------------------------

const PARAM_EXPR = /^(encodeURIComponent\(.*\)|seg\(.*\)|mac\(.*\)|resolvedSiteId|siteId)$/;

/**
 * Template expressions that are not a single path parameter, with every value
 * they can take ('{}' stands for a path parameter). The generator fails on an
 * unlisted expression so the catalogue never over-counts through a wildcard.
 */
const DYNAMIC_SEGMENTS = {
    'siteConfig.ts': { 'urlFilterTypeSchema.parse(type)': ['gateway', 'eap'], mode: ['allow', 'deny'] },
    'switchPorts.ts': { suffix: ['multi-ports', 'ports/{}'], operation: ['name', 'status', 'poe-mode', 'profile', 'profile-override'] },
};
const unknownDynamic = new Set();
const escapeRegex = (text) => text.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');

/** Splits an expression on a separator character outside quotes, template literals and brackets. */
function splitTopLevel(expr, separators) {
    const parts = [];
    let depth = 0;
    let quote = null;
    let current = '';
    for (let index = 0; index < expr.length; index++) {
        const char = expr[index];
        if (quote) {
            if (char === '\\') {
                current += char + expr[++index];
                continue;
            }
            if (char === quote) quote = null;
        } else if (char === "'" || char === '"' || char === '`') {
            quote = char;
        } else if ('([{'.includes(char)) {
            depth++;
        } else if (')]}'.includes(char)) {
            depth--;
        } else if (depth === 0 && separators.includes(char)) {
            parts.push(current);
            current = '';
            continue;
        }
        current += char;
    }
    parts.push(current);
    return parts.map((part) => part.trim());
}

/** Every string a path expression can evaluate to: literals, ternary branches and local consts. */
function candidates(expr, consts, depth = 0) {
    if (depth > 4) return [];
    const branches = splitTopLevel(expr, '?:');
    const values = branches.length > 1 ? branches.slice(1) : branches;
    return values.flatMap((value) => {
        const literal = /^(['`])([\s\S]*)\1$/.exec(value);
        if (literal) return [literal[2]];
        if (/^\w+$/.test(value) && consts.has(value)) return candidates(consts.get(value), consts, depth + 1);
        return [];
    });
}

/** Converts a TS template literal body into a regex source for a normalized spec path. */
function templateToRegex(template, file, consts) {
    let out = '';
    let index = 0;
    while (index < template.length) {
        if (template.startsWith('${', index)) {
            let depth = 1;
            let end = index + 2;
            while (end < template.length && depth > 0) {
                if (template[end] === '{') depth++;
                if (template[end] === '}') depth--;
                end++;
            }
            const expr = template.slice(index + 2, end - 1).trim();
            const values = DYNAMIC_SEGMENTS[file]?.[expr];
            if (PARAM_EXPR.test(expr)) {
                out += '\\{\\}';
            } else if (values) {
                out += `(?:${values.map((value) => value.split('{}').map(escapeRegex).join('\\{\\}')).join('|')})`;
            } else if (/^\w+$/.test(expr) && consts.has(expr)) {
                out += `(?:${candidates(consts.get(expr), consts)
                    .map((value) => templateToRegex(value, file, consts))
                    .join('|')})`;
            } else {
                unknownDynamic.add(`${file}: \${${expr}}`);
                out += '[^/]+(?:/[^/]+)*';
            }
            index = end;
        } else if (template[index] === '?') {
            break; // query string
        } else {
            out += escapeRegex(template[index]);
            index++;
        }
    }
    return out;
}

/** `const name = expression;` declarations in the source just before a call, nearest last. */
function localConsts(text, position) {
    const consts = new Map();
    const before = text.slice(Math.max(0, position - 800), position);
    for (const match of before.matchAll(/const (\w+)\s*=\s*([^;]+);/g)) consts.set(match[1], match[2].trim());
    return consts;
}

/** Arguments of the call whose opening parenthesis is at `open`. */
function callArguments(text, open) {
    let depth = 0;
    let quote = null;
    for (let index = open; index < text.length; index++) {
        const char = text[index];
        if (quote) {
            if (char === '\\') index++;
            else if (char === quote) quote = null;
        } else if (char === "'" || char === '"' || char === '`') {
            quote = char;
        } else if (char === '(') {
            depth++;
        } else if (char === ')' && --depth === 0) {
            return { args: splitTopLevel(text.slice(open + 1, index), ','), end: index + 1 };
        }
    }
    return { args: [], end: text.length };
}

const HELPER_METHOD = { get: 'GET', fetchPaginated: 'GET', fetchCollection: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE' };
const routes = []; // { method, regex, where }

function addRoute(method, versions, templates, file, consts) {
    for (const template of templates) {
        for (const version of versions) {
            routes.push({ method, regex: new RegExp(`^/openapi/${version}/\\{\\}${templateToRegex(template, file, consts)}$`), where: file });
        }
    }
}

function versionsOf(arg) {
    if (!arg) return ['v1'];
    return /^'v\d'$/.test(arg) ? [arg.slice(1, -1)] : ['v1', 'v2', 'v3'];
}

const clientDir = join(root, 'src', 'omadaClient');
for (const file of readdirSync(clientDir).filter((name) => name.endsWith('.ts') && name !== 'requestSchemas.ts')) {
    const text = readFileSync(join(clientDir, file), 'utf8');
    // siteConfig.ts builds every path through its send()/list() helpers, handled below.
    if (file !== 'siteConfig.ts') {
        for (const match of text.matchAll(/this\.buildPath\(/g)) {
            const open = match.index + match[0].length - 1;
            const { args, end } = callArguments(text, open);
            const consts = localConsts(text, match.index);
            const tail = text.slice(end, end + 600);
            const next = tail.indexOf('this.buildPath(');
            const window = next === -1 ? tail : tail.slice(0, next);
            const helper = /this\.request\.(get|fetchPaginated|fetchCollection|post|put|patch|delete)\b/.exec(window);
            const explicit = /method:\s*'(GET|POST|PUT|PATCH|DELETE)'/i.exec(window);
            const method = helper ? HELPER_METHOD[helper[1]] : explicit?.[1].toUpperCase();
            if (!method || !args[0]) continue;
            addRoute(method, versionsOf(args[1]), candidates(args[0], consts), file, consts);
        }
        continue;
    }
    for (const match of text.matchAll(/this\.(send|list)\(/g)) {
        const { args } = callArguments(text, match.index + match[0].length - 1);
        const consts = localConsts(text, match.index);
        const [method, suffixArg, versionArg] = match[1] === 'send' ? [args[0].slice(1, -1), args[2], args[5]] : ['GET', args[1], undefined];
        const templates = candidates(suffixArg ?? '', consts).map((suffix) => `/sites/\${siteId}${suffix}`);
        addRoute(method.toUpperCase(), versionsOf(versionArg), templates, file, consts);
    }
}

const implemented = new Set();
for (const op of operations) {
    const path = normalize(op.path);
    if (routes.some((route) => route.method === op.method && route.regex.test(path))) implemented.add(op.key);
}

// ---- categories and names --------------------------------------------------

const previous = new Map(); // key -> { category, tool }
const categoryOrder = [];
if (existsSync(outFile)) {
    for (const line of readFileSync(outFile, 'utf8').split('\n')) {
        const cells = line.split(' | ');
        if (!/^\| [a-z0-9-]+$/.test(cells[0] ?? '') || cells.length < 8) continue;
        const category = cells[0].slice(2);
        const tool = cells[1].replace(/`/g, '');
        const path = cells[4].replace(/`/g, '');
        previous.set(keyOf(cells[2], path), { category, tool });
        if (!categoryOrder.includes(category)) categoryOrder.push(category);
    }
}

const segmentsOf = (key) => key.split(' ')[1].split('/').filter(Boolean);
const known = operations.filter((op) => previous.has(op.key));

/** Tags first seen in controller 6.3, placed in the backlog category that owns the feature. */
const TAG_CATEGORY = {
    'Arp Detection': 'devices-switch',
    'Backup schedule': 'maintenance',
    CLI: 'devices-general',
    CertProfiles: 'auth-profiles',
    'Client Insight': 'client-insights',
    'Cloud User': 'account-cloud',
    Cluster: 'controller',
    'Device Management Setting': 'devices-general',
    'Dhcp Snooping': 'devices-switch',
    'EoGRE Tunnel': 'vpn',
    Health: 'monitoring',
    Incident: 'monitoring',
    Incidents: 'monitoring',
    Insight: 'insights',
    'Lan Multicast': 'network-lan',
    License: 'controller',
    Mlag: 'devices-switch',
    'Msp License': 'msp',
    'Network Analyze': 'monitoring',
    'Osw Port Layout': 'devices-switch',
    'OUI Based VLAN': 'network-lan',
    'Quick Action': 'sites',
    'Remote Access': 'devices-general',
    'Report v2': 'monitoring',
    Rrm: 'wireless-radio',
    'SD-WAN': 'network-wan',
    'Site Configuration': 'sites',
    Stack: 'devices-switch',
    Statistic: 'monitoring',
    'Switch QoS': 'devices-switch',
    Topology: 'monitoring',
    'Wi-Fi Calling Traffic': 'wireless-ssid',
    'Wireless IDS/IPS': 'security-wids',
    'Wired Network': 'network-lan',
    'Wireless Network': 'wireless-ssid',
    'WLAN Optimization': 'wireless-radio',
    'Controller Settings': 'controller',
};

/** tag -> category -> count over operations already catalogued. */
const tagVotes = new Map();
for (const op of known) {
    const tag = op.tag.replace(/\s*\(Template\)$/i, '');
    if (!tagVotes.has(tag)) tagVotes.set(tag, new Map());
    const votes = tagVotes.get(tag);
    const category = previous.get(op.key).category;
    votes.set(category, (votes.get(category) ?? 0) + 1);
}

function categoryFor(op) {
    const path = normalize(op.path);
    if (/^\/openapi\/v\d\/msp\//.test(path) || /\/msps?\//.test(path)) return 'msp';
    if (path.includes('/sitetemplates/') || path.endsWith('/sitetemplates')) return 'site-templates';
    const mine = segmentsOf(op.key).slice(3); // drop openapi, version, {omadacId}
    let best;
    let bestLength = 0;
    for (const other of known) {
        const theirs = segmentsOf(other.key).slice(3);
        let length = 0;
        while (length < mine.length && length < theirs.length && mine[length] === theirs[length]) length++;
        if (length > bestLength) {
            best = other;
            bestLength = length;
        }
    }
    // '/sites/{}' alone is shared by most routes and says nothing about the feature.
    const meaningful = mine[0] === 'sites' ? 3 : 1;
    if (best && bestLength >= meaningful) return previous.get(best.key).category;
    const tag = op.tag.replace(/\s*\(Template\)$/i, '');
    if (TAG_CATEGORY[tag]) return TAG_CATEGORY[tag];
    const votes = tagVotes.get(tag);
    if (votes) {
        const [winner, count] = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
        const share = count / [...votes.values()].reduce((sum, value) => sum + value, 0);
        if (share >= 0.6) return winner;
    }
    return op.tag
        .toLowerCase()
        .replace(/\(template\)/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const pascal = (segment) =>
    segment
        .split(/[-_.]+/)
        .filter(Boolean)
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join('');

const usedNames = new Set([...previous.values()].map((entry) => entry.tool));
function nameFor(op) {
    const segments = segmentsOf(op.key);
    const version = segments[1];
    const literal = segments.slice(3).filter((segment) => segment !== '{}');
    const verb =
        op.method === 'GET'
            ? /\b(list|page|all)\b/i.test(op.summary) || !segments.at(-1).startsWith('{')
                ? 'list'
                : 'get'
            : { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' }[op.method];
    let name = `${verb}${literal.map(pascal).join('')}${version === 'v1' ? '' : version.toUpperCase()}`;
    if (usedNames.has(name)) {
        let suffix = 2;
        while (usedNames.has(`${name}${suffix}`)) suffix++;
        name = `${name}${suffix}`;
    }
    usedNames.add(name);
    return name;
}

for (const op of operations) {
    const prior = previous.get(op.key);
    op.category = prior?.category ?? categoryFor(op);
    op.tool = prior?.tool ?? '';
}
// Name new operations in a stable order so suffixes do not depend on object key order.
for (const op of [...operations].sort((a, b) => a.key.localeCompare(b.key))) {
    if (!op.tool) op.tool = nameFor(op);
}

// ---- render ----------------------------------------------------------------

const byCategory = new Map();
for (const op of operations) {
    if (!byCategory.has(op.category)) byCategory.set(op.category, []);
    byCategory.get(op.category).push(op);
}
const categories = [
    ...categoryOrder.filter((category) => byCategory.has(category)),
    ...[...byCategory.keys()].filter((category) => !categoryOrder.includes(category)).sort(),
];

const source = existsSync(join(specDir, 'source.json')) ? JSON.parse(readFileSync(join(specDir, 'source.json'), 'utf8')) : {};
const total = operations.length;
const done = operations.filter((op) => implemented.has(op.key)).length;
const anchor = (category) => category.replace(/[^a-z0-9-]/g, '');

const lines = [
    '# OMADA_TOOLS.md',
    '',
    'Catalogue of every operation in the checked-in official Omada Open API specification, organised by backlog category.',
    '',
    '> Generated by `node scripts/generate-tools-catalog.mjs` — do not edit by hand.',
    `> Specification: controller ${source.controllerVersion ?? 'unknown'} (API ${source.apiVersion ?? 'unknown'}), fetched ${source.fetchedAt ?? 'unknown'} with \`scripts/fetch-openapi.mjs\`.`,
    '',
    `**${done}/${total} operations have a client route in \`src/omadaClient\`.** Status is derived statically from route templates; it says a route is called, not that every controller accepts it. Tool names for unimplemented operations are suggestions. The runtime tool inventory is validated separately by \`node scripts/check-readme-sync.mjs\`.`,
    '',
    '## Table of Contents',
    '',
    ...categories.map((category) => {
        const ops = byCategory.get(category);
        const count = ops.filter((op) => implemented.has(op.key)).length;
        return `- [${category}](#category-${anchor(category)}) (${count}/${ops.length} implemented)`;
    }),
];

for (const category of categories) {
    const ops = byCategory.get(category).sort((a, b) => a.tool.localeCompare(b.tool) || a.key.localeCompare(b.key));
    const count = ops.filter((op) => implemented.has(op.key)).length;
    lines.push(
        '',
        '---',
        '',
        `## Category: ${category}`,
        '',
        `**${count}/${ops.length} implemented**`,
        '',
        '| Category | Tool | HTTP Method | Operation | API Path | OpenAPI File | JSON Path Locator | Status |',
        '|---|---|---|---|---|---|---|---|'
    );
    for (const op of ops) {
        const status = implemented.has(op.key) ? '✅ Implemented' : '⬜ Not implemented';
        const summary = `${op.deprecated ? '[DEPRECATED] ' : ''}${op.summary}`;
        lines.push(
            `| ${category} | \`${op.tool}\` | ${op.method} | ${summary} | \`${op.path}\` | \`docs/openapi/${op.file}\` | \`$.paths['${op.path}'].${op.method.toLowerCase()}\` | ${status} |`
        );
    }
}
const content = `${lines.join('\n')}\n`;

if (unknownDynamic.size) {
    console.error('❌ Unlisted dynamic route segments; add their values to DYNAMIC_SEGMENTS:');
    for (const entry of unknownDynamic) console.error(`  ${entry}`);
    process.exit(1);
}

if (process.argv.includes('--check')) {
    const current = existsSync(outFile) ? readFileSync(outFile, 'utf8') : '';
    if (current !== content) {
        console.error('❌ OMADA_TOOLS.md is stale. Run: node scripts/generate-tools-catalog.mjs');
        process.exit(1);
    }
    console.log(`✅ OMADA_TOOLS.md is up to date (${done}/${total} operations implemented).`);
} else {
    writeFileSync(outFile, content);
    const unmatched = routes.filter((route) => !operations.some((op) => op.method === route.method && route.regex.test(normalize(op.path))));
    console.log(`Wrote ${outFile}: ${done}/${total} operations implemented across ${categories.length} categories.`);
    for (const route of unmatched) console.log(`  route not in spec: ${route.method} ${route.regex.source} (${route.where})`);
}
