import { describe, expect, it } from 'vitest';
import type { EnvironmentConfig } from '../../src/config.js';
import { extractAuthFromHeaders, resolveOmadaConfig } from '../../src/utils/omada-headers.js';

const baseEnvConfig: EnvironmentConfig = {
    baseUrl: 'https://omada.example.com',
    strictSsl: true,
    logLevel: 'info',
    logFormat: 'plain',
    useHttp: true,
    httpTransport: 'stream',
    httpBindAddr: '127.0.0.1',
    httpPath: '/mcp',
    httpEnableHealthcheck: true,
    httpAllowCors: true,
    httpNgrokEnabled: false,
};

describe('omada-headers', () => {
    describe('extractAuthFromHeaders', () => {
        it('extracts all three credential fields when present', () => {
            const headers = {
                'x-omada-client-id': 'my-client-id',
                'x-omada-client-secret': 'my-secret',
                'x-omada-omadac-id': 'my-omadac-id',
            };

            const result = extractAuthFromHeaders(headers);

            expect(result.clientId).toBe('my-client-id');
            expect(result.clientSecret).toBe('my-secret');
            expect(result.omadacId).toBe('my-omadac-id');
        });

        it('returns undefined for missing fields', () => {
            const headers = {
                'x-omada-client-id': 'my-client-id',
            };

            const result = extractAuthFromHeaders(headers);

            expect(result.clientId).toBe('my-client-id');
            expect(result.clientSecret).toBeUndefined();
            expect(result.omadacId).toBeUndefined();
        });

        it('returns empty object when no auth headers present', () => {
            const headers = {
                host: 'localhost:3000',
                'content-type': 'application/json',
            };

            const result = extractAuthFromHeaders(headers);

            expect(result.clientId).toBeUndefined();
            expect(result.clientSecret).toBeUndefined();
            expect(result.omadacId).toBeUndefined();
        });

        it('ignores empty string header values', () => {
            const headers = {
                'x-omada-client-id': '',
                'x-omada-client-secret': 'my-secret',
            };

            const result = extractAuthFromHeaders(headers);

            expect(result.clientId).toBeUndefined();
            expect(result.clientSecret).toBe('my-secret');
        });

        it('ignores non-auth omada headers (e.g. x-omada-base-url is env-only)', () => {
            const headers = {
                'x-omada-base-url': 'https://other.example.com',
                'x-omada-site-id': 'site-abc',
                'x-omada-client-id': 'my-client-id',
                'x-omada-client-secret': 'my-secret',
                'x-omada-omadac-id': 'my-omadac-id',
            };

            const result = extractAuthFromHeaders(headers);

            expect(Object.keys(result)).toEqual(['clientId', 'clientSecret', 'omadacId']);
        });

        it('handles array header values by ignoring them', () => {
            const headers = {
                'x-omada-client-id': ['id1', 'id2'] as unknown as string,
            };

            const result = extractAuthFromHeaders(headers);

            expect(result.clientId).toBeUndefined();
        });
    });

    describe('resolveOmadaConfig', () => {
        it('builds config from env when all credential fields are set', () => {
            const config: EnvironmentConfig = {
                ...baseEnvConfig,
                clientId: 'env-client-id',
                clientSecret: 'env-secret',
                omadacId: 'env-omadac-id',
            };

            const result = resolveOmadaConfig(config, {});

            expect(result.clientId).toBe('env-client-id');
            expect(result.clientSecret).toBe('env-secret');
            expect(result.omadacId).toBe('env-omadac-id');
            expect(result.baseUrl).toBe('https://omada.example.com');
            expect(result.strictSsl).toBe(true);
        });

        it('uses header values when env credentials are absent', () => {
            const config: EnvironmentConfig = { ...baseEnvConfig };

            const result = resolveOmadaConfig(config, {
                clientId: 'header-client-id',
                clientSecret: 'header-secret',
                omadacId: 'header-omadac-id',
            });

            expect(result.clientId).toBe('header-client-id');
            expect(result.clientSecret).toBe('header-secret');
            expect(result.omadacId).toBe('header-omadac-id');
        });

        it('env values win over header values', () => {
            const config: EnvironmentConfig = {
                ...baseEnvConfig,
                clientId: 'env-client-id',
                clientSecret: 'env-secret',
                omadacId: 'env-omadac-id',
            };

            const result = resolveOmadaConfig(config, {
                clientId: 'header-client-id',
                clientSecret: 'header-secret',
                omadacId: 'header-omadac-id',
            });

            expect(result.clientId).toBe('env-client-id');
            expect(result.clientSecret).toBe('env-secret');
            expect(result.omadacId).toBe('env-omadac-id');
        });

        it('env wins for some fields and headers fill the rest', () => {
            const config: EnvironmentConfig = {
                ...baseEnvConfig,
                clientId: 'env-client-id',
            };

            const result = resolveOmadaConfig(config, {
                clientId: 'header-client-id',
                clientSecret: 'header-secret',
                omadacId: 'header-omadac-id',
            });

            expect(result.clientId).toBe('env-client-id');
            expect(result.clientSecret).toBe('header-secret');
            expect(result.omadacId).toBe('header-omadac-id');
        });

        it('preserves env-only fields (siteId, strictSsl, requestTimeout)', () => {
            const config: EnvironmentConfig = {
                ...baseEnvConfig,
                clientId: 'env-client-id',
                clientSecret: 'env-secret',
                omadacId: 'env-omadac-id',
                siteId: 'env-site-id',
                strictSsl: false,
                requestTimeout: 5000,
            };

            const result = resolveOmadaConfig(config, {});

            expect(result.siteId).toBe('env-site-id');
            expect(result.strictSsl).toBe(false);
            expect(result.requestTimeout).toBe(5000);
        });

        it('throws when clientId is missing from both env and headers', () => {
            const config: EnvironmentConfig = {
                ...baseEnvConfig,
                clientSecret: 'env-secret',
                omadacId: 'env-omadac-id',
            };

            expect(() => resolveOmadaConfig(config, {})).toThrow(
                'Missing required Omada credentials: set OMADA_CLIENT_ID env var or x-omada-client-id header'
            );
        });

        it('throws when clientSecret is missing from both env and headers', () => {
            const config: EnvironmentConfig = {
                ...baseEnvConfig,
                clientId: 'env-client-id',
                omadacId: 'env-omadac-id',
            };

            expect(() => resolveOmadaConfig(config, {})).toThrow(
                'Missing required Omada credentials: set OMADA_CLIENT_SECRET env var or x-omada-client-secret header'
            );
        });

        it('throws when omadacId is missing from both env and headers', () => {
            const config: EnvironmentConfig = {
                ...baseEnvConfig,
                clientId: 'env-client-id',
                clientSecret: 'env-secret',
            };

            expect(() => resolveOmadaConfig(config, {})).toThrow(
                'Missing required Omada credentials: set OMADA_OMADAC_ID env var or x-omada-omadac-id header'
            );
        });

        it('throws when all credential fields are absent', () => {
            const config: EnvironmentConfig = { ...baseEnvConfig };

            expect(() => resolveOmadaConfig(config, {})).toThrow('Missing required Omada credentials');
        });
    });
});
