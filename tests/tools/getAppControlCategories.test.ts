import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAppControlCategoriesTool } from '../../src/tools/getAppControlCategories.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAppControlCategories', () => {
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
            getAppControlCategories: vi.fn(),
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

    describe('registerGetAppControlCategoriesTool', () => {
        it('should register the tool', () => {
            registerGetAppControlCategoriesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getAppControlCategories', expect.any(Object), expect.any(Function));
        });

        it('should execute and return result', async () => {
            const mockData = [{ id: 1, name: 'Social Media' }];
            (mockClient.getAppControlCategories as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetAppControlCategoriesTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getAppControlCategories).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getAppControlCategories as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetAppControlCategoriesTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getAppControlCategories).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getAppControlCategories as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetAppControlCategoriesTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
