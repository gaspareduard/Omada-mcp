import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGroupPolicyDetailTool } from '../../src/tools/getGroupPolicyDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGroupPolicyDetail', () => {
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
            getGroupProfilesByType: vi.fn(),
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

    describe('registerGetGroupPolicyDetailTool', () => {
        it('should register the tool', () => {
            registerGetGroupPolicyDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGroupPolicyDetail', expect.any(Object), expect.any(Function));
        });

        it('should call getGroupProfilesByType with groupType', async () => {
            const mockData = [{ id: 'group-1' }];
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGroupPolicyDetailTool(mockServer, mockClient);
            const result = await toolHandler({ groupType: '0' }, { sessionId: 'test' });
            expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith('0', undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetGroupPolicyDetailTool(mockServer, mockClient);
            await toolHandler({ groupType: '1', siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith('1', 'site-1', undefined);
        });

        it.each(['3', '4', '5', '7'])('should support extended groupType "%s"', async (groupType) => {
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockResolvedValue([]);
            registerGetGroupPolicyDetailTool(mockServer, mockClient);
            await toolHandler({ groupType }, { sessionId: 'test' });
            expect(mockClient.getGroupProfilesByType).toHaveBeenCalledWith(groupType, undefined, undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getGroupProfilesByType as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetGroupPolicyDetailTool(mockServer, mockClient);
            await expect(toolHandler({ groupType: '0' }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
