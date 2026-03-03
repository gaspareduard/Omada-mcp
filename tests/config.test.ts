import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadConfigFromEnv } from '../src/config.js';
import * as loggerModule from '../src/utils/logger.js';

describe('config', () => {
    let mockEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        // Create a minimal valid environment
        mockEnv = {
            OMADA_BASE_URL: 'https://omada.example.com',
            OMADA_CLIENT_ID: 'test-client-id',
            OMADA_CLIENT_SECRET: 'test-client-secret',
            OMADA_OMADAC_ID: 'test-omadac-id',
        };

        // Mock logger to avoid console output during tests
        vi.spyOn(loggerModule.logger, 'warn').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('loadConfigFromEnv', () => {
        it('should load valid configuration with required fields only', () => {
            const config = loadConfigFromEnv(mockEnv);

            expect(config.baseUrl).toBe('https://omada.example.com');
            expect(config.clientId).toBe('test-client-id');
            expect(config.clientSecret).toBe('test-client-secret');
            expect(config.omadacId).toBe('test-omadac-id');
            expect(config.siteId).toBeUndefined();
            expect(config.strictSsl).toBe(true); // Default
            expect(config.logLevel).toBe('info'); // Default
            expect(config.logFormat).toBe('plain'); // Default
            expect(config.useHttp).toBe(false); // Default
        });

        it('should strip trailing slash from baseUrl', () => {
            mockEnv.OMADA_BASE_URL = 'https://omada.example.com/';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.baseUrl).toBe('https://omada.example.com');
        });

        it('should throw error if OMADA_BASE_URL is missing', () => {
            delete mockEnv.OMADA_BASE_URL;

            expect(() => loadConfigFromEnv(mockEnv)).toThrow('Invalid environment configuration');
        });

        it('should throw error if OMADA_BASE_URL is not a valid URL', () => {
            mockEnv.OMADA_BASE_URL = 'not-a-url';

            expect(() => loadConfigFromEnv(mockEnv)).toThrow('Invalid environment configuration');
        });

        it('should throw error if OMADA_CLIENT_ID is missing in stdio mode', () => {
            delete mockEnv.OMADA_CLIENT_ID;

            expect(() => loadConfigFromEnv(mockEnv)).toThrow('Invalid environment configuration');
        });

        it('should throw error if OMADA_CLIENT_SECRET is missing in stdio mode', () => {
            delete mockEnv.OMADA_CLIENT_SECRET;

            expect(() => loadConfigFromEnv(mockEnv)).toThrow('Invalid environment configuration');
        });

        it('should throw error if OMADA_OMADAC_ID is missing in stdio mode', () => {
            delete mockEnv.OMADA_OMADAC_ID;

            expect(() => loadConfigFromEnv(mockEnv)).toThrow('Invalid environment configuration');
        });

        it('should NOT throw if OMADA_CLIENT_ID is missing in HTTP mode', () => {
            mockEnv.MCP_SERVER_USE_HTTP = 'true';
            delete mockEnv.OMADA_CLIENT_ID;

            expect(() => loadConfigFromEnv(mockEnv)).not.toThrow();
        });

        it('should NOT throw if OMADA_CLIENT_SECRET is missing in HTTP mode', () => {
            mockEnv.MCP_SERVER_USE_HTTP = 'true';
            delete mockEnv.OMADA_CLIENT_SECRET;

            expect(() => loadConfigFromEnv(mockEnv)).not.toThrow();
        });

        it('should NOT throw if OMADA_OMADAC_ID is missing in HTTP mode', () => {
            mockEnv.MCP_SERVER_USE_HTTP = 'true';
            delete mockEnv.OMADA_OMADAC_ID;

            expect(() => loadConfigFromEnv(mockEnv)).not.toThrow();
        });

        it('should load with only OMADA_BASE_URL set in HTTP mode', () => {
            mockEnv.MCP_SERVER_USE_HTTP = 'true';
            delete mockEnv.OMADA_CLIENT_ID;
            delete mockEnv.OMADA_CLIENT_SECRET;
            delete mockEnv.OMADA_OMADAC_ID;

            const config = loadConfigFromEnv(mockEnv);
            expect(config.baseUrl).toBe('https://omada.example.com');
            expect(config.clientId).toBeUndefined();
            expect(config.clientSecret).toBeUndefined();
            expect(config.omadacId).toBeUndefined();
        });

        it('should accept optional OMADA_SITE_ID', () => {
            mockEnv.OMADA_SITE_ID = 'test-site-id';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.siteId).toBe('test-site-id');
        });

        it('should parse OMADA_STRICT_SSL as true', () => {
            mockEnv.OMADA_STRICT_SSL = 'true';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.strictSsl).toBe(true);
        });

        it('should parse OMADA_STRICT_SSL as false', () => {
            mockEnv.OMADA_STRICT_SSL = 'false';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.strictSsl).toBe(false);
        });

        it('should parse OMADA_TIMEOUT as number', () => {
            mockEnv.OMADA_TIMEOUT = '5000';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.requestTimeout).toBe(5000);
        });

        it('should accept valid log levels', () => {
            const logLevels: Array<'debug' | 'info' | 'warn' | 'error'> = ['debug', 'info', 'warn', 'error'];

            for (const level of logLevels) {
                mockEnv.MCP_SERVER_LOG_LEVEL = level;
                const config = loadConfigFromEnv(mockEnv);
                expect(config.logLevel).toBe(level);
            }
        });

        it('should accept valid log formats', () => {
            const formats: Array<'plain' | 'json' | 'gcp-json'> = ['plain', 'json', 'gcp-json'];

            for (const format of formats) {
                mockEnv.MCP_SERVER_LOG_FORMAT = format;
                const config = loadConfigFromEnv(mockEnv);
                expect(config.logFormat).toBe(format);
            }
        });

        it('should parse MCP_SERVER_USE_HTTP as true', () => {
            mockEnv.MCP_SERVER_USE_HTTP = 'true';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.useHttp).toBe(true);
        });

        it('should parse MCP_SERVER_USE_HTTP as false', () => {
            mockEnv.MCP_SERVER_USE_HTTP = 'false';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.useHttp).toBe(false);
        });

        it('should parse MCP_HTTP_PORT as number', () => {
            mockEnv.MCP_HTTP_PORT = '8080';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpPort).toBe(8080);
        });

        it('should always return stream as httpTransport regardless of env', () => {
            const config = loadConfigFromEnv(mockEnv);
            expect(config.httpTransport).toBe('stream');
        });

        it('should use default httpPath', () => {
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpPath).toBe('/mcp');
        });

        it('should override httpPath when explicitly set', () => {
            mockEnv.MCP_HTTP_PATH = '/custom-path';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpPath).toBe('/custom-path');
        });

        it('should use default httpBindAddr', () => {
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpBindAddr).toBe('127.0.0.1');
        });

        it('should accept valid IPv4 bind address', () => {
            mockEnv.MCP_HTTP_BIND_ADDR = '192.168.1.1';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpBindAddr).toBe('192.168.1.1');
        });

        it('should accept valid IPv6 bind address', () => {
            mockEnv.MCP_HTTP_BIND_ADDR = '::1';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpBindAddr).toBe('::1');
        });

        it('should throw error for invalid bind address', () => {
            mockEnv.MCP_HTTP_BIND_ADDR = 'invalid-address';

            expect(() => loadConfigFromEnv(mockEnv)).toThrow('MCP_HTTP_BIND_ADDR must be a valid IPv4 or IPv6 address');
        });

        it('should parse MCP_HTTP_ENABLE_HEALTHCHECK as true', () => {
            mockEnv.MCP_HTTP_ENABLE_HEALTHCHECK = 'true';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpEnableHealthcheck).toBe(true);
        });

        it('should parse MCP_HTTP_ENABLE_HEALTHCHECK as false', () => {
            mockEnv.MCP_HTTP_ENABLE_HEALTHCHECK = 'false';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpEnableHealthcheck).toBe(false);
        });

        it('should accept custom healthcheck path', () => {
            mockEnv.MCP_HTTP_HEALTHCHECK_PATH = '/health';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpHealthcheckPath).toBe('/health');
        });

        it('should parse MCP_HTTP_ALLOW_CORS as true', () => {
            mockEnv.MCP_HTTP_ALLOW_CORS = 'true';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpAllowCors).toBe(true);
        });

        it('should parse MCP_HTTP_ALLOW_CORS as false', () => {
            mockEnv.MCP_HTTP_ALLOW_CORS = 'false';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpAllowCors).toBe(false);
        });

        it('should use default allowed origins', () => {
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpAllowedOrigins).toEqual(['127.0.0.1', 'localhost']);
        });

        it('should parse comma-separated allowed origins', () => {
            mockEnv.MCP_HTTP_ALLOWED_ORIGINS = 'localhost, 127.0.0.1, example.com';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpAllowedOrigins).toEqual(['localhost', '127.0.0.1', 'example.com']);
        });

        it('should handle wildcard in allowed origins', () => {
            mockEnv.MCP_HTTP_ALLOWED_ORIGINS = '*';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpAllowedOrigins).toEqual([]);
            expect(loggerModule.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Wildcard (*) origin allowed'));
        });

        it('should throw error for invalid origin', () => {
            mockEnv.MCP_HTTP_ALLOWED_ORIGINS = 'localhost, invalid_origin!';

            expect(() => loadConfigFromEnv(mockEnv)).toThrow('MCP_HTTP_ALLOWED_ORIGINS contains invalid origin');
        });

        it('should parse MCP_HTTP_NGROK_ENABLED as true', () => {
            mockEnv.MCP_HTTP_NGROK_ENABLED = 'true';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpNgrokEnabled).toBe(true);
        });

        it('should parse MCP_HTTP_NGROK_ENABLED as false', () => {
            mockEnv.MCP_HTTP_NGROK_ENABLED = 'false';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpNgrokEnabled).toBe(false);
        });

        it('should accept ngrok auth token', () => {
            mockEnv.MCP_HTTP_NGROK_AUTH_TOKEN = 'test-ngrok-token';
            const config = loadConfigFromEnv(mockEnv);

            expect(config.httpNgrokAuthToken).toBe('test-ngrok-token');
        });

        it('should load complete configuration with all fields', () => {
            mockEnv = {
                OMADA_BASE_URL: 'https://omada.example.com/',
                OMADA_CLIENT_ID: 'client-123',
                OMADA_CLIENT_SECRET: 'secret-456',
                OMADA_OMADAC_ID: 'omadac-789',
                OMADA_SITE_ID: 'site-abc',
                OMADA_STRICT_SSL: 'false',
                OMADA_TIMEOUT: '10000',
                MCP_SERVER_LOG_LEVEL: 'debug',
                MCP_SERVER_LOG_FORMAT: 'json',
                MCP_SERVER_USE_HTTP: 'true',
                MCP_HTTP_PORT: '9000',
                MCP_HTTP_BIND_ADDR: '0.0.0.0',
                MCP_HTTP_PATH: '/api/mcp',
                MCP_HTTP_ENABLE_HEALTHCHECK: 'true',
                MCP_HTTP_HEALTHCHECK_PATH: '/healthz',
                MCP_HTTP_ALLOW_CORS: 'true',
                MCP_HTTP_ALLOWED_ORIGINS: 'example.com, test.com',
                MCP_HTTP_NGROK_ENABLED: 'true',
                MCP_HTTP_NGROK_AUTH_TOKEN: 'ngrok-token-xyz',
            };

            const config = loadConfigFromEnv(mockEnv);

            expect(config).toEqual({
                baseUrl: 'https://omada.example.com',
                clientId: 'client-123',
                clientSecret: 'secret-456',
                omadacId: 'omadac-789',
                siteId: 'site-abc',
                strictSsl: false,
                requestTimeout: 10000,
                logLevel: 'debug',
                logFormat: 'json',
                useHttp: true,
                httpPort: 9000,
                httpTransport: 'stream',
                httpBindAddr: '0.0.0.0',
                httpPath: '/api/mcp',
                httpEnableHealthcheck: true,
                httpHealthcheckPath: '/healthz',
                httpAllowCors: true,
                httpAllowedOrigins: ['example.com', 'test.com'],
                httpNgrokEnabled: true,
                httpNgrokAuthToken: 'ngrok-token-xyz',
            });
        });
    });
});
