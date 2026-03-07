import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetWidsBlacklistTool } from '../../src/tools/getWidsBlacklist.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getWidsBlacklist', () => {
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
            getWidsBlacklist: vi.fn(),
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

    describe('registerGetWidsBlacklistTool', () => {
        it('should register the getWidsBlacklist tool with correct schema', () => {
            registerGetWidsBlacklistTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getWidsBlacklist', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = [{ mac: 'AA-BB-CC-DD-EE-FF', name: 'Rogue AP' }];
            (mockClient.getWidsBlacklist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWidsBlacklistTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getWidsBlacklist).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = [{ mac: '11-22-33-44-55-66', name: 'Blacklisted AP' }];
            (mockClient.getWidsBlacklist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetWidsBlacklistTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getWidsBlacklist).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getWidsBlacklist as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetWidsBlacklistTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getWidsBlacklist',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
