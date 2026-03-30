import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPortSchedulePortsTool } from '../../src/tools/getPortSchedulePorts.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPortSchedulePorts', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getPortSchedulePorts: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetPortSchedulePortsTool', () => {
        it('should register the tool', () => {
            registerGetPortSchedulePortsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPortSchedulePorts', expect.any(Object), expect.any(Function));
        });

        it('should call getPortSchedulePorts with no args', async () => {
            const mockData = { id: 'ports-1' };
            (mockClient.getPortSchedulePorts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPortSchedulePortsTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getPortSchedulePorts).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getPortSchedulePorts as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetPortSchedulePortsTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getPortSchedulePorts).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getPortSchedulePorts as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetPortSchedulePortsTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
