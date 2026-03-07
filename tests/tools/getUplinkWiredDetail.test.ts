import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUplinkWiredDetailTool } from '../../src/tools/getUplinkWiredDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUplinkWiredDetail', () => {
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
            getUplinkWiredDetail: vi.fn(),
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

    describe('registerGetUplinkWiredDetailTool', () => {
        it('should register the getUplinkWiredDetail tool with correct schema', () => {
            registerGetUplinkWiredDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getUplinkWiredDetail', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { port: 1, linkSpeed: '1000M', poeStatus: true };
            (mockClient.getUplinkWiredDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetUplinkWiredDetailTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getUplinkWiredDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { port: 2, linkSpeed: '100M', poeStatus: false };
            (mockClient.getUplinkWiredDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetUplinkWiredDetailTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getUplinkWiredDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getUplinkWiredDetail as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetUplinkWiredDetailTool(mockServer, mockClient);

            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getUplinkWiredDetail',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
