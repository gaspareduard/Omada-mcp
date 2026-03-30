import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLanProfileListTool } from '../../src/tools/getLanProfileList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLanProfileList', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getLanProfileList: vi.fn(),
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

    describe('registerGetLanProfileListTool', () => {
        it('should register the getLanProfileList tool with correct schema', () => {
            registerGetLanProfileListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getLanProfileList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { profiles: [] };
            (mockClient.getLanProfileList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLanProfileListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getLanProfileList).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { profiles: [{ name: 'Default' }] };
            (mockClient.getLanProfileList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetLanProfileListTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getLanProfileList).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getLanProfileList as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetLanProfileListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getLanProfileList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
