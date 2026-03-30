import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGlobalSecuritySettingTool } from '../../src/tools/getGlobalSecuritySetting.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGlobalSecuritySetting', () => {
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
            getThreatList: vi.fn(),
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

    describe('registerGetGlobalSecuritySettingTool', () => {
        it('should register the tool', () => {
            registerGetGlobalSecuritySettingTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGlobalSecuritySetting', expect.any(Object), expect.any(Function));
        });

        it('should call getThreatList with correct params', async () => {
            const mockData = { data: [], totalRows: 0, currentPage: 1, currentSize: 0 };
            (mockClient.getThreatList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGlobalSecuritySettingTool(mockServer, mockClient);
            const result = await toolHandler({ archived: false, page: 1, pageSize: 10, startTime: 1000000, endTime: 2000000 }, { sessionId: 'test' });
            expect(mockClient.getThreatList).toHaveBeenCalledWith(
                { archived: false, page: 1, pageSize: 10, startTime: 1000000, endTime: 2000000 },
                undefined
            );
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getThreatList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetGlobalSecuritySettingTool(mockServer, mockClient);
            await expect(
                toolHandler({ archived: false, page: 1, pageSize: 10, startTime: 1000, endTime: 2000 }, { sessionId: 'test' })
            ).rejects.toThrow('fail');
        });
    });
});
