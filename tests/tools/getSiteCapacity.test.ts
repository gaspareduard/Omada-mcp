import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteCapacityTool } from '../../src/tools/getSiteCapacity.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteCapacity', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getSiteCapacity: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetSiteCapacityTool', () => {
        it('should register the tool', () => {
            registerGetSiteCapacityTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteCapacity', expect.any(Object), expect.any(Function));
        });

        it('should call getSiteCapacity with no args', async () => {
            const mockData = { id: 'capacity-1' };
            (mockClient.getSiteCapacity as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteCapacityTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getSiteCapacity).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getSiteCapacity as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetSiteCapacityTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getSiteCapacity).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getSiteCapacity as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetSiteCapacityTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
