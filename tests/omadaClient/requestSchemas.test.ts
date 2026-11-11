import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import * as schemas from '../../src/omadaClient/requestSchemas.js';

describe('omadaClient/requestSchemas (generated)', () => {
    it('is up to date with docs/openapi', () => {
        const script = fileURLToPath(new URL('../../scripts/generate-request-schemas.mjs', import.meta.url));
        expect(execFileSync(process.execPath, [script, '--check'], { encoding: 'utf8' })).toContain('up to date');
    });

    it('enforces required fields and rejects undocumented keys', () => {
        const route = { name: 'r', status: false, destinations: ['198.51.100.0/24'], routeType: 0, metric: 1 };
        expect(schemas.staticRoutingConfigSchema.parse(route)).toEqual(route);
        expect(() => schemas.staticRoutingConfigSchema.parse({ ...route, extra: 1 })).toThrow();
        const { metric: _metric, ...missingMetric } = route;
        expect(() => schemas.staticRoutingConfigSchema.parse(missingMetric)).toThrow();
    });

    it('anchors documented patterns as full-string matches', () => {
        const route = { name: 'r', status: false, destinations: [], routeType: 0, metric: 1 };
        expect(schemas.staticRoutingConfigSchema.safeParse({ ...route, nextHopIp: '192.0.2.1' }).success).toBe(true);
        expect(schemas.staticRoutingConfigSchema.safeParse({ ...route, nextHopIp: 'x192.0.2.1y' }).success).toBe(false);
        expect(schemas.staticRoutingConfigSchema.safeParse({ ...route, name: ' leading' }).success).toBe(false);
    });

    it('validates nested objects strictly', () => {
        const dns = { enable: false, name: 'n', domain: 'host.example', type: 0, ipAddresses: ['192.0.2.1'] };
        expect(schemas.lanDnsOpenApiVOSchema.safeParse(dns).success).toBe(true);
        expect(
            schemas.createMdnsRuleOpenApiVOSchema.safeParse({ name: 'm', status: true, profileIds: [], osg: { serviceNetworks: [] } }).success
        ).toBe(false);
    });

    it('keeps integer and length constraints', () => {
        expect(schemas.lanDnsOpenApiVOSchema.safeParse({ enable: false, name: '', domain: 'a.example', type: 0 }).success).toBe(false);
        expect(schemas.oswPoeRecoverOpenApiVO03Schema.safeParse({ ports: [1.5] }).success).toBe(false);
    });

    it('applies integer bounds documented only in field prose (S4)', () => {
        const wireguard = {
            name: 'wg',
            status: true,
            listenPort: 51820,
            localIp: '10.0.0.1',
            mtu: 1420,
            privateKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        };
        expect(schemas.wireguardOpenApiVOSchema.safeParse(wireguard).success).toBe(true);
        expect(schemas.wireguardOpenApiVOSchema.safeParse({ ...wireguard, mtu: -1 }).success).toBe(false);
        expect(schemas.wireguardOpenApiVOSchema.safeParse({ ...wireguard, listenPort: 999999 }).success).toBe(false);
        const route = { name: 'r', status: false, destinations: [], routeType: 0, metric: 16 };
        expect(schemas.staticRoutingConfigSchema.safeParse(route).success).toBe(false);
    });
});
