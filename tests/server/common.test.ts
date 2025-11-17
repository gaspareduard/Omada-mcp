import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToolExtra } from '../../src/server/common.js';
import {
    clientIdSchema,
    customRequestSchema,
    deviceIdSchema,
    safeSerialize,
    setupServerLogging,
    siteInputSchema,
    stackIdSchema,
    toToolResult,
    wrapToolHandler,
} from '../../src/server/common.js';
import { logger } from '../../src/utils/logger.js';

function createToolExtra(overrides: Partial<ToolExtra> = {}): ToolExtra {
    const controller = new AbortController();
    return {
        signal: controller.signal,
        requestId: overrides.requestId ?? 'request-id',
        sendNotification: overrides.sendNotification ?? vi.fn(),
        sendRequest: overrides.sendRequest ?? vi.fn(),
        ...overrides,
    };
}

describe('server/common', () => {
    describe('toToolResult', () => {
        it('should convert string to tool result', () => {
            const result = toToolResult('test string');

            expect(result).toEqual({
                content: [{ type: 'text', text: 'test string' }],
            });
        });

        it('should convert object to formatted JSON string', () => {
            const obj = { key: 'value', nested: { data: 123 } };
            const result = toToolResult(obj);

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(obj, null, 2),
                    },
                ],
            });
        });

        it('should convert array to formatted JSON string', () => {
            const arr = [1, 2, 3];
            const result = toToolResult(arr);

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(arr, null, 2),
                    },
                ],
            });
        });

        it('should handle null', () => {
            const result = toToolResult(null);

            expect(result).toEqual({
                content: [{ type: 'text', text: 'null' }],
            });
        });

        it('should handle undefined', () => {
            const result = toToolResult(undefined);

            expect(result).toEqual({
                content: [],
            });
        });

        it('should handle empty string', () => {
            const result = toToolResult('');

            expect(result).toEqual({
                content: [],
            });
        });

        it('should handle numbers', () => {
            const result = toToolResult(123);

            expect(result).toEqual({
                content: [{ type: 'text', text: '123' }],
            });
        });

        it('should handle booleans', () => {
            const result = toToolResult(true);

            expect(result).toEqual({
                content: [{ type: 'text', text: 'true' }],
            });
        });
    });

    describe('safeSerialize', () => {
        it('should serialize simple objects', () => {
            const obj = { key: 'value' };
            expect(safeSerialize(obj)).toBe(JSON.stringify(obj));
        });

        it('should serialize arrays', () => {
            const arr = [1, 2, 3];
            expect(safeSerialize(arr)).toBe(JSON.stringify(arr));
        });

        it('should serialize strings', () => {
            expect(safeSerialize('test')).toBe('"test"');
        });

        it('should serialize numbers', () => {
            expect(safeSerialize(123)).toBe('123');
        });

        it('should serialize null', () => {
            expect(safeSerialize(null)).toBe('null');
        });

        it('should handle circular references', () => {
            const obj: { self?: unknown } = {};
            obj.self = obj;

            expect(safeSerialize(obj)).toBe('[unserializable]');
        });
    });

    describe('schema validations', () => {
        describe('siteInputSchema', () => {
            it('should accept valid siteId', () => {
                const result = siteInputSchema.safeParse({ siteId: 'site-123' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should accept empty object', () => {
                const result = siteInputSchema.safeParse({});
                expect(result.success).toBe(true);
            });

            it('should reject empty siteId', () => {
                const result = siteInputSchema.safeParse({ siteId: '' });
                expect(result.success).toBe(false);
            });
        });

        describe('clientIdSchema', () => {
            it('should accept valid clientId and siteId', () => {
                const result = clientIdSchema.safeParse({ clientId: 'client-123', siteId: 'site-123' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.clientId).toBe('client-123');
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should accept valid clientId without siteId', () => {
                const result = clientIdSchema.safeParse({ clientId: 'client-123' });
                expect(result.success).toBe(true);
            });

            it('should reject missing clientId', () => {
                const result = clientIdSchema.safeParse({});
                expect(result.success).toBe(false);
            });

            it('should reject empty clientId', () => {
                const result = clientIdSchema.safeParse({ clientId: '' });
                expect(result.success).toBe(false);
            });
        });

        describe('deviceIdSchema', () => {
            it('should accept valid deviceId and siteId', () => {
                const result = deviceIdSchema.safeParse({ deviceId: 'device-123', siteId: 'site-123' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.deviceId).toBe('device-123');
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should accept valid deviceId without siteId', () => {
                const result = deviceIdSchema.safeParse({ deviceId: 'device-123' });
                expect(result.success).toBe(true);
            });

            it('should reject missing deviceId', () => {
                const result = deviceIdSchema.safeParse({});
                expect(result.success).toBe(false);
            });

            it('should reject empty deviceId', () => {
                const result = deviceIdSchema.safeParse({ deviceId: '' });
                expect(result.success).toBe(false);
            });
        });

        describe('customRequestSchema', () => {
            it('should accept minimal valid request', () => {
                const result = customRequestSchema.safeParse({ url: '/api/test' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.method).toBe('GET');
                    expect(result.data.url).toBe('/api/test');
                }
            });

            it('should accept full request with all fields', () => {
                const result = customRequestSchema.safeParse({
                    method: 'POST',
                    url: '/api/test',
                    params: { key: 'value' },
                    data: { body: 'data' },
                    siteId: 'site-123',
                });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.method).toBe('POST');
                    expect(result.data.url).toBe('/api/test');
                    expect(result.data.params).toEqual({ key: 'value' });
                    expect(result.data.data).toEqual({ body: 'data' });
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should reject missing url', () => {
                const result = customRequestSchema.safeParse({ method: 'GET' });
                expect(result.success).toBe(false);
            });

            it('should reject empty url', () => {
                const result = customRequestSchema.safeParse({ url: '' });
                expect(result.success).toBe(false);
            });

            it('should default method to GET', () => {
                const result = customRequestSchema.safeParse({ url: '/api/test' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.method).toBe('GET');
                }
            });
        });

        describe('stackIdSchema', () => {
            it('should accept valid stackId and siteId', () => {
                const result = stackIdSchema.safeParse({ stackId: 'stack-123', siteId: 'site-123' });
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.data.stackId).toBe('stack-123');
                    expect(result.data.siteId).toBe('site-123');
                }
            });

            it('should accept valid stackId without siteId', () => {
                const result = stackIdSchema.safeParse({ stackId: 'stack-123' });
                expect(result.success).toBe(true);
            });

            it('should reject missing stackId', () => {
                const result = stackIdSchema.safeParse({});
                expect(result.success).toBe(false);
            });

            it('should reject empty stackId', () => {
                const result = stackIdSchema.safeParse({ stackId: '' });
                expect(result.success).toBe(false);
            });
        });
    });

    describe('createServer', () => {
        it('should create MCP server instance', async () => {
            const { createServer } = await import('../../src/server/common.js');
            const mockClient = {} as unknown as import('../../src/omadaClient/index.js').OmadaClient;

            const server = createServer(mockClient);

            expect(server).toBeDefined();
            expect(server).toBeTypeOf('object');
            // Verify the server has the protocol server property
            expect((server as { server: unknown }).server).toBeDefined();
        });

        it('should setup logging on the server', async () => {
            const { createServer } = await import('../../src/server/common.js');
            const mockClient = {} as unknown as import('../../src/omadaClient/index.js').OmadaClient;

            const server = createServer(mockClient);
            const protocol = (server as { server: { oninitialized?: unknown; onclose?: unknown; onerror?: unknown } }).server;

            // Verify logging handlers are set up
            expect(protocol.oninitialized).toBeDefined();
            expect(protocol.onclose).toBeDefined();
            expect(protocol.onerror).toBeDefined();
        });
    });

    describe('wrapToolHandler', () => {
        it('should log tool invocation and completion', async () => {
            const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
            const handler = vi.fn(async () => toToolResult({ ok: true }));
            const extra = createToolExtra({ sessionId: 'session-1' });

            const wrapped = wrapToolHandler('test-tool', handler);
            await wrapped({ value: 1 }, extra);

            expect(handler).toHaveBeenCalledWith({ value: 1 }, extra);
            expect(infoSpy).toHaveBeenCalledWith('Tool invoked', expect.objectContaining({ tool: 'test-tool' }));
            expect(infoSpy).toHaveBeenCalledWith('Tool completed', expect.objectContaining({ tool: 'test-tool' }));
        });

        it('should log and rethrow errors', async () => {
            const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined);
            const handler = vi.fn(async () => {
                await Promise.resolve();
                throw new Error('failure');
            });

            const wrapped = wrapToolHandler('error-tool', handler);
            const extra = createToolExtra();

            await expect(wrapped({}, extra)).rejects.toThrow('failure');
            expect(errorSpy).toHaveBeenCalledWith('Tool failed', expect.objectContaining({ tool: 'error-tool' }));
        });
    });

    describe('setupServerLogging', () => {
        type Handler = (request: unknown, extra: unknown) => Promise<unknown>;
        interface ProtocolStub {
            setRequestHandler: (schema: { shape: { method: { value: string } } }, handler: Handler) => Handler;
            getCapabilities: () => { version: string };
            oninitialized?: () => void;
            onclose?: () => void;
            onerror?: (error: unknown) => void;
            fallbackRequestHandler?: Handler;
            fallbackNotificationHandler?: (notification: unknown) => Promise<void>;
        }

        function createServerStub() {
            const handlers = new Map<string, Handler>();

            const protocol: ProtocolStub = {
                setRequestHandler(schema, handler) {
                    const method = schema.shape.method.value;
                    handlers.set(method, handler);
                    return handler;
                },
                getCapabilities: vi.fn(() => ({ version: 'test' })),
            };

            const server = { server: protocol } as unknown as McpServer;
            return { server, protocol, handlers };
        }

        beforeEach(() => {
            vi.spyOn(logger, 'info').mockImplementation(() => undefined);
            vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
            vi.spyOn(logger, 'error').mockImplementation(() => undefined);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should summarize initialize, tools/list, and tools/call responses', async () => {
            const { server, handlers, protocol } = createServerStub();
            setupServerLogging(server);

            protocol.setRequestHandler({ shape: { method: { value: 'initialize' } } }, () => Promise.resolve({ protocolVersion: '1.0' }));
            protocol.setRequestHandler({ shape: { method: { value: 'tools/list' } } }, () => Promise.resolve({ tools: ['one', 'two'] }));
            protocol.setRequestHandler({ shape: { method: { value: 'tools/call' } } }, () => Promise.resolve({ name: 'test-tool' }));

            await handlers.get('initialize')?.({}, { sessionId: 'init' });
            await handlers.get('tools/list')?.({}, { sessionId: 'list' });
            await handlers.get('tools/call')?.({}, { sessionId: 'call' });

            expect(logger.info).toHaveBeenCalledWith('MCP request handled', expect.objectContaining({ protocolVersion: '1.0' }));
            expect(logger.info).toHaveBeenCalledWith('MCP request handled', expect.objectContaining({ toolCount: 2 }));
            expect(logger.info).toHaveBeenCalledWith('MCP request handled', expect.objectContaining({ tool: 'test-tool' }));
        });

        it('should wire lifecycle hooks and fallback handlers', async () => {
            const { server, protocol } = createServerStub();
            setupServerLogging(server);

            protocol.oninitialized?.();
            protocol.onclose?.();
            protocol.onerror?.(new Error('boom'));

            await expect(protocol.fallbackRequestHandler?.({ method: 'custom', params: { value: 1 } }, { sessionId: 'fallback' })).rejects.toThrow(
                'Unhandled request: custom'
            );
            await protocol.fallbackNotificationHandler?.({ method: 'notify', params: { value: 2 } });

            expect(logger.warn).toHaveBeenCalledWith('Server connection closed');
            expect(logger.error).toHaveBeenCalledWith('Server error', expect.objectContaining({ error: expect.any(Error) }));
            expect(logger.warn).toHaveBeenCalledWith('Unhandled request received', expect.objectContaining({ method: 'custom' }));
            expect(logger.warn).toHaveBeenCalledWith('Unhandled notification received', expect.objectContaining({ method: 'notify' }));
        });
    });
});
