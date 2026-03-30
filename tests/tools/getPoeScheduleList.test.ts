import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPoeScheduleListTool } from '../../src/tools/getPoeScheduleList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPoeScheduleList', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getPoeScheduleList: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetPoeScheduleListTool', () => {
        it('should register the tool', () => {
            registerGetPoeScheduleListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPoeScheduleList', expect.any(Object), expect.any(Function));
        });

        it('should call getPoeScheduleList with no args', async () => {
            const mockData = { id: 'sched-1' };
            (mockClient.getPoeScheduleList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPoeScheduleListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getPoeScheduleList).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getPoeScheduleList as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetPoeScheduleListTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getPoeScheduleList).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getPoeScheduleList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetPoeScheduleListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
