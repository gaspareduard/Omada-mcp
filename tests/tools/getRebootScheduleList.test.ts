import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRebootScheduleListTool } from '../../src/tools/getRebootScheduleList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRebootScheduleList', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getRebootScheduleList: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetRebootScheduleListTool', () => {
        it('should register the tool', () => {
            registerGetRebootScheduleListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRebootScheduleList', expect.any(Object), expect.any(Function));
        });

        it('should call getRebootScheduleList with siteTemplateId', async () => {
            const mockData = { id: 'sched-1' };
            (mockClient.getRebootScheduleList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRebootScheduleListTool(mockServer, mockClient);
            const result = await toolHandler({ siteTemplateId: 'tmpl-1' }, { sessionId: 'test' });
            expect(mockClient.getRebootScheduleList).toHaveBeenCalledWith('tmpl-1', undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getRebootScheduleList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetRebootScheduleListTool(mockServer, mockClient);
            await expect(toolHandler({ siteTemplateId: 'tmpl-1' }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
