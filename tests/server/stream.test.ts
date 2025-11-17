import type { IncomingMessage, ServerResponse } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EnvironmentConfig } from '../../src/config.js';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { createServer } from '../../src/server/common.js';
import { createStreamTransport, handleStreamRequest, type StreamTransportState } from '../../src/server/stream.js';
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

vi.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => {
    return {
        StreamableHTTPServerTransport: vi.fn(function (this: {
            handleRequest: ReturnType<typeof vi.fn>;
            onerror: unknown;
            onsessioninitialized?: (sessionId: string) => void;
            onsessionclosed?: (sessionId: string) => void;
        }) {
            this.handleRequest = vi.fn().mockResolvedValue(undefined);
            this.onerror = undefined;
        }),
    };
});

describe('Stream Server', () => {
    let mockClient: OmadaClient;
    let mockConfigStateless: EnvironmentConfig;
    let mockConfigStateful: EnvironmentConfig;
    let mockRes: ServerResponse;
    let mockReq: IncomingMessage;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock OmadaClient
        mockClient = {} as OmadaClient;

        // Mock EnvironmentConfig - Stateless
        mockConfigStateless = {
            omadacId: 'test-omadac-id',
            baseUrl: 'https://test.local',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            strictSsl: true,
            requestTimeout: 30000,
            httpAllowedOrigins: ['http://localhost', 'http://127.0.0.1'],
            httpBindAddr: '127.0.0.1',
            httpPort: 3000,
            httpTransport: 'stream',
            httpPath: '/mcp',
            httpEnableHealthcheck: true,
            httpHealthcheckPath: '/healthz',
            httpAllowCors: true,
            httpNgrokEnabled: false,
            stateful: false,
            logLevel: 'info',
            logFormat: 'plain',
        } as EnvironmentConfig;

        // Mock EnvironmentConfig - Stateful
        mockConfigStateful = {
            ...mockConfigStateless,
            stateful: true,
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
            method: 'POST',
            url: '/mcp',
            headers: {
                host: 'localhost:3000',
                origin: 'http://localhost',
                'mcp-session-id': 'test-session-123',
            },
            on: vi.fn(),
        } as unknown as IncomingMessage;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('createStreamTransport', () => {
        it('should create Stream transport in stateless mode', () => {
            const { transport, server } = createStreamTransport(mockClient, mockConfigStateless);

            expect(StreamableHTTPServerTransport).toHaveBeenCalledWith(
                expect.objectContaining({
                    sessionIdGenerator: undefined,
                    allowedOrigins: mockConfigStateless.httpAllowedOrigins,
                    enableDnsRebindingProtection: true,
                })
            );

            expect(transport).toBeDefined();
            expect(server).toBeDefined();
            expect(transport.onerror).toBeDefined();
        });

        it('should create Stream transport in stateful mode', () => {
            const { transport, server } = createStreamTransport(mockClient, mockConfigStateful);

            const callArgs = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];

            expect(callArgs.sessionIdGenerator).toBeDefined();
            expect(callArgs.sessionIdGenerator).toBeInstanceOf(Function);
            expect(callArgs.allowedOrigins).toEqual(mockConfigStateful.httpAllowedOrigins);
            expect(callArgs.enableDnsRebindingProtection).toBe(true);

            expect(transport).toBeDefined();
            expect(server).toBeDefined();
        });

        it('should log stateless mode message', () => {
            createStreamTransport(mockClient, mockConfigStateless);

            expect(logger.info).toHaveBeenCalledWith('Starting Streamable HTTP transport in stateless mode; Mcp-Session-Id headers are optional');
        });

        it('should not log stateless mode message in stateful mode', () => {
            vi.clearAllMocks();
            createStreamTransport(mockClient, mockConfigStateful);

            expect(logger.info).not.toHaveBeenCalledWith(expect.stringContaining('stateless mode'));
        });

        it('should set up session callbacks in stateful mode', () => {
            createStreamTransport(mockClient, mockConfigStateful);

            const callArgs = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];

            expect(callArgs.onsessioninitialized).toBeDefined();
            expect(callArgs.onsessionclosed).toBeDefined();
        });

        it('should call onsessioninitialized callback', () => {
            createStreamTransport(mockClient, mockConfigStateful);

            const callArgs = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];
            const sessionId = 'test-session-id';

            if (callArgs.onsessioninitialized) {
                callArgs.onsessioninitialized(sessionId);
            }

            expect(logger.info).toHaveBeenCalledWith('Session initialized', { sessionId });
        });

        it('should call onsessionclosed callback', () => {
            createStreamTransport(mockClient, mockConfigStateful);

            const callArgs = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];
            const sessionId = 'test-session-id';

            if (callArgs.onsessionclosed) {
                callArgs.onsessionclosed(sessionId);
            }

            expect(logger.info).toHaveBeenCalledWith('Session closed', { sessionId });
        });

        it('should handle transport errors through onerror handler', () => {
            const { transport } = createStreamTransport(mockClient, mockConfigStateless);

            const testError = new Error('Transport error');
            if (transport.onerror) {
                transport.onerror(testError);
            }

            expect(logger.error).toHaveBeenCalledWith('Streamable HTTP transport error', {
                error: testError,
                message: testError.message,
            });
        });

        it('should generate unique session IDs in stateful mode', () => {
            createStreamTransport(mockClient, mockConfigStateful);

            const callArgs = vi.mocked(StreamableHTTPServerTransport).mock.calls[0][0];
            const sessionId1 = callArgs.sessionIdGenerator?.();
            const sessionId2 = callArgs.sessionIdGenerator?.();

            expect(sessionId1).toBeDefined();
            expect(sessionId2).toBeDefined();
            expect(sessionId1).not.toBe(sessionId2);
        });
    });

    describe('handleStreamRequest', () => {
        it('should handle stream request successfully without existing transport', async () => {
            await handleStreamRequest(mockClient, mockConfigStateless, mockReq, mockRes, undefined);

            expect(StreamableHTTPServerTransport).toHaveBeenCalled();
            expect(vi.mocked(createServer)).toHaveBeenCalled();
        });

        it('should reuse existing transport when provided', async () => {
            const existingTransport: StreamTransportState = {
                transport: new StreamableHTTPServerTransport({ sessionIdGenerator: undefined }),
                server: vi.mocked(createServer)(mockClient),
            };

            vi.clearAllMocks();

            await handleStreamRequest(mockClient, mockConfigStateless, mockReq, mockRes, undefined, existingTransport);

            // Should not create new transport
            expect(StreamableHTTPServerTransport).not.toHaveBeenCalled();
            // Should not create new server
            expect(createServer).not.toHaveBeenCalled();
            // Should reuse existing transport
            expect(existingTransport.transport.handleRequest).toHaveBeenCalled();
        });

        it('should connect server to transport for new transport', async () => {
            await handleStreamRequest(mockClient, mockConfigStateless, mockReq, mockRes, undefined);

            const serverMock = vi.mocked(createServer).mock.results[0].value;
            expect(serverMock.connect).toHaveBeenCalled();
        });

        it('should not reconnect server for existing transport', async () => {
            const existingTransport: StreamTransportState = {
                transport: new StreamableHTTPServerTransport({ sessionIdGenerator: undefined }),
                server: vi.mocked(createServer)(mockClient),
            };

            await handleStreamRequest(mockClient, mockConfigStateless, mockReq, mockRes, undefined, existingTransport);

            // Connect should not be called for existing transport
            expect(existingTransport.server.connect).not.toHaveBeenCalled();
        });

        it('should log incoming request with headers', async () => {
            await handleStreamRequest(mockClient, mockConfigStateless, mockReq, mockRes, undefined);

            expect(logger.info).toHaveBeenCalledWith('Streamable HTTP request received', {
                method: 'POST',
                url: '/mcp',
                sessionId: 'test-session-123',
                origin: 'http://localhost',
                host: 'localhost:3000',
            });
        });

        it('should handle missing session id header', async () => {
            const reqWithoutSession = {
                ...mockReq,
                headers: {
                    host: 'localhost:3000',
                    origin: 'http://localhost',
                },
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfigStateless, reqWithoutSession, mockRes, undefined);

            expect(logger.info).toHaveBeenCalledWith(
                'Streamable HTTP request received',
                expect.objectContaining({
                    sessionId: undefined,
                })
            );
        });

        it('should handle missing origin header', async () => {
            const reqWithoutOrigin = {
                ...mockReq,
                headers: {
                    host: 'localhost:3000',
                    'mcp-session-id': 'test-session-123',
                },
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfigStateless, reqWithoutOrigin, mockRes, undefined);

            expect(logger.info).toHaveBeenCalledWith(
                'Streamable HTTP request received',
                expect.objectContaining({
                    origin: '(not set)',
                })
            );
        });

        it('should handle missing host header', async () => {
            const reqWithoutHost = {
                ...mockReq,
                headers: {
                    origin: 'http://localhost',
                    'mcp-session-id': 'test-session-123',
                },
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfigStateless, reqWithoutHost, mockRes, undefined);

            expect(logger.info).toHaveBeenCalledWith(
                'Streamable HTTP request received',
                expect.objectContaining({
                    host: '(not set)',
                })
            );
        });

        it('should pass parsed body to transport', async () => {
            const parsedBody = { method: 'initialize', params: {} };

            await handleStreamRequest(mockClient, mockConfigStateless, mockReq, mockRes, parsedBody);

            const transport = vi.mocked(StreamableHTTPServerTransport).mock.results[0].value;
            expect(transport.handleRequest).toHaveBeenCalledWith(mockReq, mockRes, parsedBody);
        });

        it('should log successful request handling', async () => {
            await handleStreamRequest(mockClient, mockConfigStateless, mockReq, mockRes, undefined);

            expect(logger.debug).toHaveBeenCalledWith('Streamable HTTP request handled', {
                method: 'POST',
                sessionId: 'test-session-123',
            });
        });

        it('should handle transport errors and log', async () => {
            const testError = new Error('Request handling failed');
            // @ts-expect-error - Mock implementation for testing error handling
            vi.mocked(StreamableHTTPServerTransport).mockImplementationOnce(function (this: Record<string, unknown>) {
                this.handleRequest = vi.fn().mockRejectedValue(testError);
                this.onerror = undefined;
            });

            await expect(handleStreamRequest(mockClient, mockConfigStateless, mockReq, mockRes, undefined)).rejects.toThrow(
                'Request handling failed'
            );

            expect(logger.error).toHaveBeenCalledWith(
                'Failed to handle Streamable HTTP request',
                expect.objectContaining({
                    error: testError,
                    method: 'POST',
                    url: '/mcp',
                    origin: 'http://localhost',
                    host: 'localhost:3000',
                    allowedOrigins: mockConfigStateless.httpAllowedOrigins,
                })
            );
        });

        it('should return state in stateful mode', async () => {
            const result = await handleStreamRequest(mockClient, mockConfigStateful, mockReq, mockRes, undefined);

            expect(result).toBeDefined();
            expect(result?.transport).toBeDefined();
            expect(result?.server).toBeDefined();
        });

        it('should not return state in stateless mode', async () => {
            const result = await handleStreamRequest(mockClient, mockConfigStateless, mockReq, mockRes, undefined);

            expect(result).toBeUndefined();
        });

        it('should handle GET requests', async () => {
            const getReq = {
                ...mockReq,
                method: 'GET',
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfigStateless, getReq, mockRes, undefined);

            expect(logger.info).toHaveBeenCalledWith(
                'Streamable HTTP request received',
                expect.objectContaining({
                    method: 'GET',
                })
            );
        });

        it('should handle DELETE requests', async () => {
            const deleteReq = {
                ...mockReq,
                method: 'DELETE',
            } as unknown as IncomingMessage;

            await handleStreamRequest(mockClient, mockConfigStateless, deleteReq, mockRes, undefined);

            expect(logger.info).toHaveBeenCalledWith(
                'Streamable HTTP request received',
                expect.objectContaining({
                    method: 'DELETE',
                })
            );
        });
    });
});
