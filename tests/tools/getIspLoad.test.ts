import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetIspLoadTool } from '../../src/tools/getIspLoad.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getIspLoad', () => {
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
            getIspLoad: vi.fn(),
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

    describe('registerGetIspLoadTool', () => {
        it('should register the getIspLoad tool with correct schema', () => {
            registerGetIspLoadTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getIspLoad', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required args', async () => {
            const mockData = { load: [{ wan: 'WAN1', utilization: 50 }] };
            (mockClient.getIspLoad as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetIspLoadTool(mockServer, mockClient);
            const start = 1700000000;
            const end = 1700003600;
            const result = await toolHandler({ start, end }, { sessionId: 'test-session' });
            expect(mockClient.getIspLoad).toHaveBeenCalledWith(undefined, start, end, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { load: [] };
            (mockClient.getIspLoad as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetIspLoadTool(mockServer, mockClient);
            const start = 1700000000;
            const end = 1700003600;
            const result = await toolHandler({ siteId: 'test-site', start, end }, { sessionId: 'test-session' });
            expect(mockClient.getIspLoad).toHaveBeenCalledWith('test-site', start, end, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getIspLoad as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetIspLoadTool(mockServer, mockClient);
            await expect(toolHandler({ start: 1700000000, end: 1700003600 }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getIspLoad',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
