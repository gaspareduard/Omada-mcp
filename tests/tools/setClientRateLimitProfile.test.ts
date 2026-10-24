import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetClientRateLimitProfileTool } from '../../src/tools/setClientRateLimitProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/setClientRateLimitProfile', () => {
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
            setClientRateLimitProfile: vi.fn(),
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

    describe('registerSetClientRateLimitProfileTool', () => {
        it('should register the setClientRateLimitProfile tool with correct schema', () => {
            registerSetClientRateLimitProfileTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('setClientRateLimitProfile', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required args', async () => {
            const mockData = { success: true };
            (mockClient.setClientRateLimitProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerSetClientRateLimitProfileTool(mockServer, mockClient);

            const result = await toolHandler(
                { dryRun: false, clientMac: 'AA:BB:CC:DD:EE:FF', profileId: 'profile-123' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.setClientRateLimitProfile).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'profile-123', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: expect.any(String) }],
                structuredContent: {
                    action: 'setClientRateLimitProfile',
                    target: 'AA:BB:CC:DD:EE:FF',
                    mode: 'apply',
                    status: 'submitted',
                    summary: 'Client rate-limit change submitted.',
                    result: mockData,
                },
            });
            expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
        });

        it('should pass siteId when provided', async () => {
            const mockData = { success: true };
            (mockClient.setClientRateLimitProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerSetClientRateLimitProfileTool(mockServer, mockClient);

            await toolHandler(
                { dryRun: false, clientMac: 'AA:BB:CC:DD:EE:FF', profileId: 'profile-123', siteId: 'test-site' },
                { sessionId: 'test-session' }
            );

            expect(mockClient.setClientRateLimitProfile).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'profile-123', 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.setClientRateLimitProfile as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerSetClientRateLimitProfileTool(mockServer, mockClient);

            await expect(
                toolHandler({ dryRun: false, clientMac: 'AA:BB:CC:DD:EE:FF', profileId: 'profile-123' }, { sessionId: 'test-session' })
            ).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'setClientRateLimitProfile',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerSetClientRateLimitProfileTool(mockServer, mockClient);
        const result = (await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', profileId: 'profile-123' }, { sessionId: 'preview' })) as {
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
