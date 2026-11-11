#!/usr/bin/env node
/**
 * generate-request-schemas.mjs
 *
 * Generates strict Zod request-body schemas from the checked-in official Omada
 * OpenAPI specs (docs/openapi/*.json) so write tools validate payloads exactly
 * as documented, including required fields, patterns, and numeric bounds.
 *
 *   node scripts/generate-request-schemas.mjs          # write src/omadaClient/requestSchemas.ts
 *   node scripts/generate-request-schemas.mjs --check  # fail if the file is stale
 *
 * The output is excluded from Biome so --check can compare it byte-for-byte.
 *
 * Java Bean Validation patterns are full-string matches, so each pattern is
 * anchored as ^(?:pattern)$. Patterns that JavaScript cannot compile are omitted
 * and listed in the generated header.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outFile = join(root, 'src', 'omadaClient', 'requestSchemas.ts');

/** Request-body component schemas used by write tools, grouped by tag spec. */
const TARGETS = {
    '03-device.json': ['ApUpdateWlanGroupOpenApiVO', 'LocateDeviceRequest', 'AdoptDeviceRequest', 'OswPoeRecoverOpenApiVO'],
    '04-site-setting.json': [
        'LanNetworkOpenApiV2VO',
        'LanProfileConfigOpenApiVO',
        'CreateWlanGroupOpenApiVO',
        'UpdateWlanGroupOpenApiVO',
        'CreateSsidOpenApiVO',
        'CreateGroupOpenApiVO',
        'CreateMdnsRuleOpenApiVO',
        'LanDnsOpenApiVO',
        'CreateDdnsOpenApiVO',
        'UpnpSettingOpenApiVO',
        'ALGSetting',
        'SnmpSettingOpenApiVO',
        'PortForwardingConfig',
        'OtoNatOpenApiVO',
        'StaticRoutingConfig',
        'PolicyRoutingConfig',
        'UrlFilteringOpenApiVO',
        'AttackDefenseSetting',
        'IpsInfo',
        'MacFiltering',
        'SiteToSiteVpn',
        'ClientToSiteVpnServer',
        'ClientToSiteVpnClient',
        'WireguardOpenApiVO',
    ],
    '05-client.json': ['Client Name Setting', 'Client Lock To AP Setting'],
    '06-hotspot.json': ['CreateVoucherGroupOpenApiVO'],
};

const MAX_DESCRIPTION = 240;
const omittedPatterns = [];

function identifier(file, name) {
    const words = name
        .replace(/[^A-Za-z0-9]+/g, ' ')
        .trim()
        .split(/\s+/);
    const camel = words.map((word, index) => (index === 0 ? word[0].toLowerCase() + word.slice(1) : word[0].toUpperCase() + word.slice(1))).join('');
    return `${camel}${file.startsWith('04') ? '' : file.slice(0, 2)}Schema`.replace(/^(\d)/, '_$1');
}

function describe(text) {
    if (!text) return '';
    const clean = text
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!clean) return '';
    const short = clean.length > MAX_DESCRIPTION ? `${clean.slice(0, MAX_DESCRIPTION - 1)}…` : clean;
    return `.describe(${JSON.stringify(short)})`;
}

function patternFor(pattern, where) {
    const anchored = `^(?:${pattern})$`;
    try {
        new RegExp(anchored);
        return `.regex(new RegExp(${JSON.stringify(anchored)}))`;
    } catch {
        omittedPatterns.push(where);
        return '';
    }
}

function createGenerator(file, spec) {
    const components = spec.components?.schemas ?? {};
    const emitted = new Map(); // component name -> identifier
    const order = [];
    const visiting = new Set();

    function refName(ref) {
        return ref.split('/').pop();
    }

    function component(name) {
        if (emitted.has(name)) return emitted.get(name);
        if (!components[name]) throw new Error(`${file}: missing component ${name}`);
        if (visiting.has(name)) throw new Error(`${file}: recursive component ${name} is not supported`);
        visiting.add(name);
        const id = identifier(file, name);
        const body = expression(components[name], name);
        visiting.delete(name);
        emitted.set(name, id);
        order.push(`export const ${id} = ${body};`);
        return id;
    }

    function expression(schema, where) {
        if (schema.$ref) return component(refName(schema.$ref));
        if (schema.allOf?.length === 1) return expression(schema.allOf[0], where);
        if (schema.oneOf || schema.anyOf) {
            const variants = (schema.oneOf ?? schema.anyOf).map((item, index) => expression(item, `${where}|${index}`));
            return variants.length === 1 ? variants[0] : `z.union([${variants.join(', ')}])`;
        }
        if (schema.allOf) throw new Error(`${file}: allOf with several members at ${where} is not supported`);

        const type = schema.type ?? (schema.properties ? 'object' : undefined);
        let out;
        switch (type) {
            case 'object': {
                if (!schema.properties) {
                    out = 'z.record(z.string(), z.unknown())';
                    break;
                }
                const required = new Set(schema.required ?? []);
                const fields = Object.entries(schema.properties).map(([key, value]) => {
                    const inner = expression(value, `${where}.${key}`);
                    const optional = required.has(key) ? '' : '.optional()';
                    return `${JSON.stringify(key)}: ${inner}${optional}${describe(value.description)}`;
                });
                out = `z.object({ ${fields.join(', ')} }).strict()`;
                break;
            }
            case 'array': {
                out = `z.array(${expression(schema.items ?? {}, `${where}[]`)})`;
                if (schema.minItems !== undefined) out += `.min(${schema.minItems})`;
                if (schema.maxItems !== undefined) out += `.max(${schema.maxItems})`;
                break;
            }
            case 'integer':
            case 'number': {
                out = type === 'integer' ? 'z.number().int()' : 'z.number().finite()';
                if (schema.enum) {
                    out =
                        schema.enum.length === 1
                            ? `z.literal(${schema.enum[0]})`
                            : `z.union([${schema.enum.map((v) => `z.literal(${v})`).join(', ')}])`;
                    break;
                }
                if (schema.minimum !== undefined) out += `.min(${schema.minimum})`;
                if (schema.maximum !== undefined) out += `.max(${schema.maximum})`;
                break;
            }
            case 'string': {
                if (schema.enum) {
                    out = `z.enum([${schema.enum.map((v) => JSON.stringify(v)).join(', ')}])`;
                    break;
                }
                out = 'z.string()';
                if (schema.minLength !== undefined) out += `.min(${schema.minLength})`;
                if (schema.maxLength !== undefined) out += `.max(${schema.maxLength})`;
                if (schema.pattern) out += patternFor(schema.pattern, `${file}:${where}`);
                break;
            }
            case 'boolean':
                out = 'z.boolean()';
                break;
            default:
                out = 'z.unknown()';
        }
        return out;
    }

    return { component, order };
}

const sections = [];
for (const [file, names] of Object.entries(TARGETS)) {
    const spec = JSON.parse(readFileSync(join(root, 'docs', 'openapi', file), 'utf8'));
    const generator = createGenerator(file, spec);
    for (const name of names) generator.component(name);
    sections.push(`// ---- docs/openapi/${file} ----\n${generator.order.join('\n\n')}`);
}

const header = [
    '// Generated by scripts/generate-request-schemas.mjs from docs/openapi. Do not edit by hand.',
    '// Regenerate with: node scripts/generate-request-schemas.mjs',
    omittedPatterns.length
        ? `// Patterns JavaScript cannot compile were omitted at: ${omittedPatterns.join(', ')}`
        : '// All documented patterns compiled as anchored JavaScript regular expressions.',
    "import { z } from 'zod';",
].join('\n');

const content = `${header}\n\n${sections.join('\n\n')}\n`;

if (process.argv.includes('--check')) {
    let current = '';
    try {
        current = readFileSync(outFile, 'utf8');
    } catch {
        // missing file is stale
    }
    if (current !== content) {
        console.error('❌ src/omadaClient/requestSchemas.ts is stale. Run: node scripts/generate-request-schemas.mjs');
        process.exit(1);
    }
    console.log('✅ Generated request schemas are up to date.');
} else {
    writeFileSync(outFile, content);
    console.log(`Wrote ${outFile}${omittedPatterns.length ? ` (${omittedPatterns.length} pattern(s) omitted)` : ''}`);
}
