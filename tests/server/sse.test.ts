import type { IncomingMessage, ServerResponse } from 'node:http';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnvironmentConfig } from '../../src/config.js';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { createServer } from '../../src/server/common.js';
import { createSseTransport, getSseMessagePath, handleSseConnection, handleSseMessage } from '../../src/server/sse.js';
import { logger } from '../../src/utils/logger.js';

// Mock dependencies
vi.mock('../../src/utils/logger.js', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    },
}));

vi.mock('../../src/server/common.js', () => ({
    createServer: vi.fn(() => ({
        connect: vi.fn().mockResolvedValue(undefined),
        server: {
            oninitialized: undefined,
            onclose: undefined,
            onerror: undefined,
            fallbackRequestHandler: undefined,
            fallbackNotificationHandler: undefined,
        },
    })),
}));

vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => {
    return {
        SSEServerTransport: vi.fn(function (this: {
            start: ReturnType<typeof vi.fn>;
            handlePostMessage: ReturnType<typeof vi.fn>;
            sessionId: string;
            onerror: unknown;
        }) {
            this.start = vi.fn().mockResolvedValue(undefined);
            this.handlePostMessage = vi.fn().mockResolvedValue(undefined);
            this.sessionId = 'mock-session-id';
            this.onerror = undefined;
        }),
    };
});

describe('SSE Server', () => {
    let mockClient: OmadaClient;
    let mockConfig: EnvironmentConfig;
    let mockRes: ServerResponse;
    let mockReq: IncomingMessage;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock OmadaClient
        mockClient = {} as OmadaClient;

        // Mock EnvironmentConfig
        mockConfig = {
            omadacId: 'test-omadac-id',
            baseUrl: 'https://test.local',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            strictSsl: true,
            requestTimeout: 30000,
            httpAllowedOrigins: ['http://localhost', 'http://127.0.0.1'],
            httpBindAddr: '127.0.0.1',
            httpPort: 3000,
            httpTransport: 'sse',
            httpPath: '/sse',
            httpEnableHealthcheck: true,
            httpHealthcheckPath: '/healthz',
            httpAllowCors: true,
            httpNgrokEnabled: false,
            logLevel: 'info',
            logFormat: 'plain',
        } as EnvironmentConfig;

        // Mock ServerResponse
        mockRes = {
            writeHead: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
            on: vi.fn(),
        } as unknown as ServerResponse;

        // Mock IncomingMessage
        mockReq = {
            method: 'GET',
            url: '/sse',
            headers: {
                host: 'localhost:3000',
                origin: 'http://localhost',
            },
            on: vi.fn(),
        } as unknown as IncomingMessage;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createSseTransport', () => {
        it('should create SSE transport with correct configuration', () => {
            const endpoint = '/sse';
            const { transport, server } = createSseTransport(mockClient, mockConfig, endpoint, mockRes);

            expect(SSEServerTransport).toHaveBeenCalledWith(endpoint, mockRes, {
                allowedOrigins: mockConfig.httpAllowedOrigins,
                enableDnsRebindingProtection: true,
            });

            expect(transport).toBeDefined();
            expect(server).toBeDefined();
            expect(transport.onerror).toBeDefined();
        });

        it('should set error handler on transport', () => {
            const endpoint = '/sse';
            const { transport } = createSseTransport(mockClient, mockConfig, endpoint, mockRes);

            expect(transport.onerror).toBeInstanceOf(Function);
        });

        it('should handle transport errors through onerror handler', () => {
            const endpoint = '/sse';
            const { transport } = createSseTransport(mockClient, mockConfig, endpoint, mockRes);

            const testError = new Error('Transport error');
            if (transport.onerror) {
                transport.onerror(testError);
            }

            expect(logger.error).toHaveBeenCalledWith('SSE transport error', {
                error: testError,
                message: testError.message,
            });
        });
    });

    describe('handleSseConnection', () => {
        it('should establish SSE connection successfully', async () => {
            const endpoint = '/sse';
            const result = await handleSseConnection(mockClient, mockConfig, endpoint, mockReq, mockRes);

            expect(result).toBeDefined();
            expect(result.transport).toBeDefined();
            expect(result.server).toBeDefined();
            expect(result.transport.start).toHaveBeenCalled();
        });

        it('should log connection request with headers', async () => {
            const endpoint = '/sse';

            await handleSseConnection(mockClient, mockConfig, endpoint, mockReq, mockRes);

            expect(logger.info).toHaveBeenCalledWith('SSE connection request received', {
                method: 'GET',
                url: '/sse',
                origin: 'http://localhost',
                host: 'localhost:3000',
            });
        });

        it('should handle missing origin header', async () => {
            const endpoint = '/sse';
            const reqWithoutOrigin = {
                ...mockReq,
                headers: { host: 'localhost:3000' },
            } as unknown as IncomingMessage;

            await handleSseConnection(mockClient, mockConfig, endpoint, reqWithoutOrigin, mockRes);

            expect(logger.info).toHaveBeenCalledWith(
                'SSE connection request received',
                expect.objectContaining({
                    origin: '(not set)',
                })
            );
        });

        it('should handle missing host header', async () => {
            const endpoint = '/sse';
            const reqWithoutHost = {
                ...mockReq,
                headers: { origin: 'http://localhost' },
            } as unknown as IncomingMessage;

            await handleSseConnection(mockClient, mockConfig, endpoint, reqWithoutHost, mockRes);

            expect(logger.info).toHaveBeenCalledWith(
                'SSE connection request received',
                expect.objectContaining({
                    host: '(not set)',
                })
            );
        });

        it('should log successful connection establishment', async () => {
            const endpoint = '/sse';

            await handleSseConnection(mockClient, mockConfig, endpoint, mockReq, mockRes);

            expect(logger.info).toHaveBeenCalledWith('SSE connection established', {
                sessionId: 'mock-session-id',
            });
        });

        it('should handle connection errors', async () => {
            const endpoint = '/sse';
            const testError = new Error('Connection failed');

            vi.mocked(createServer).mockReturnValueOnce({
                connect: vi.fn().mockRejectedValue(testError),
            } as unknown as ReturnType<typeof createServer>);

            await expect(handleSseConnection(mockClient, mockConfig, endpoint, mockReq, mockRes)).rejects.toThrow('Connection failed');

            expect(logger.error).toHaveBeenCalledWith(
                'Failed to establish SSE connection',
                expect.objectContaining({
                    error: testError,
                    origin: 'http://localhost',
                    host: 'localhost:3000',
                    allowedOrigins: mockConfig.httpAllowedOrigins,
                })
            );
        });

        it('should connect server to transport', async () => {
            const endpoint = '/sse';

            await handleSseConnection(mockClient, mockConfig, endpoint, mockReq, mockRes);

            const serverMock = vi.mocked(createServer).mock.results[0].value;
            expect(serverMock.connect).toHaveBeenCalled();
        });

        it('should start transport after connection', async () => {
            const endpoint = '/sse';
            const result = await handleSseConnection(mockClient, mockConfig, endpoint, mockReq, mockRes);

            expect(result.transport.start).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleSseMessage', () => {
        let mockTransport: SSEServerTransport;

        beforeEach(() => {
            mockTransport = new SSEServerTransport('/sse', mockRes);
        });

        it('should handle POST message successfully', async () => {
            const parsedBody = { method: 'test', params: {} };

            await handleSseMessage(mockTransport, mockReq, mockRes, parsedBody);

            expect(mockTransport.handlePostMessage).toHaveBeenCalledWith(mockReq, mockRes, parsedBody);
        });

        it('should log message receipt', async () => {
            const parsedBody = { method: 'test' };

            await handleSseMessage(mockTransport, mockReq, mockRes, parsedBody);

            expect(logger.debug).toHaveBeenCalledWith('SSE message received', {
                sessionId: 'mock-session-id',
                hasBody: true,
            });
        });

        it('should log message handling completion', async () => {
            const parsedBody = { method: 'test' };

            await handleSseMessage(mockTransport, mockReq, mockRes, parsedBody);

            expect(logger.debug).toHaveBeenCalledWith('SSE message handled', {
                sessionId: 'mock-session-id',
            });
        });

        it('should handle message without body', async () => {
            await handleSseMessage(mockTransport, mockReq, mockRes, undefined);

            expect(logger.debug).toHaveBeenCalledWith(
                'SSE message received',
                expect.objectContaining({
                    hasBody: false,
                })
            );
        });

        it('should propagate handlePostMessage errors', async () => {
            const testError = new Error('Message handling failed');
            mockTransport.handlePostMessage = vi.fn().mockRejectedValue(testError);

            await expect(handleSseMessage(mockTransport, mockReq, mockRes, {})).rejects.toThrow('Message handling failed');
        });
    });

    describe('getSseMessagePath', () => {
        it('should return the correct message path', () => {
            const messagePath = getSseMessagePath();
            expect(messagePath).toBe('/messages');
        });
    });
});
