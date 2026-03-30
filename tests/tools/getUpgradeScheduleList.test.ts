import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUpgradeScheduleListTool } from '../../src/tools/getUpgradeScheduleList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUpgradeScheduleList', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getUpgradeScheduleList: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetUpgradeScheduleListTool', () => {
        it('should register the tool', () => {
            registerGetUpgradeScheduleListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUpgradeScheduleList', expect.any(Object), expect.any(Function));
        });

        it('should call getUpgradeScheduleList with no args', async () => {
            const mockData = { id: 'sched-1' };
            (mockClient.getUpgradeScheduleList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetUpgradeScheduleListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getUpgradeScheduleList).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getUpgradeScheduleList as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetUpgradeScheduleListTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getUpgradeScheduleList).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getUpgradeScheduleList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetUpgradeScheduleListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
