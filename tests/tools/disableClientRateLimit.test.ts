import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerDisableClientRateLimitTool } from '../../src/tools/disableClientRateLimit.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/disableClientRateLimit', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
            }),
        } as unknown as McpServer;

        mockClient = {
            disableClientRateLimit: vi.fn(),
        } as unknown as OmadaClient;

        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            // Mock implementation
        });
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('registerDisableClientRateLimitTool', () => {
        it('should register the disableClientRateLimit tool with correct schema', () => {
            registerDisableClientRateLimitTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('disableClientRateLimit', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with clientMac', async () => {
            const mockData = { result: 'success' };
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerDisableClientRateLimitTool(mockServer, mockClient);

            const result = await toolHandler({ dryRun: false, clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.disableClientRateLimit).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: expect.any(String) }],
                structuredContent: {
                    action: 'disableClientRateLimit',
                    target: 'AA-BB-CC-DD-EE-FF',
                    mode: 'apply',
                    status: 'submitted',
                    summary: 'Client rate-limit change submitted.',
                    result: mockData,
                },
            });
            expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { result: 'success' };
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerDisableClientRateLimitTool(mockServer, mockClient);

            await toolHandler({ dryRun: false, clientMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.disableClientRateLimit).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerDisableClientRateLimitTool(mockServer, mockClient);

            const result = await toolHandler({ dryRun: false, clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result.structuredContent).toMatchObject({ action: 'disableClientRateLimit', mode: 'apply', status: 'submitted' });
            expect(result.structuredContent?.result).toBeUndefined();
            expect(JSON.parse(result.content[0].text as string)).toMatchObject({ status: 'submitted' });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.disableClientRateLimit as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerDisableClientRateLimitTool(mockServer, mockClient);

            await expect(toolHandler({ dryRun: false, clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'disableClientRateLimit',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerDisableClientRateLimitTool(mockServer, mockClient);
        const result = (await toolHandler({ clientMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'preview' })) as {
            content: { text: string }[];
            structuredContent: Record<string, unknown>;
        };
        const summary = JSON.parse(result.content[0].text);
        expect(summary).toMatchObject({ mode: 'dry-run', status: 'planned' });
        expect(result.structuredContent).toEqual(expect.objectContaining(summary));
        for (const [name, operation] of Object.entries(mockClient)) {
            if (!/^(get|list|resolve)/.test(name)) expect(operation).not.toHaveBeenCalled();
        }
    });
});
