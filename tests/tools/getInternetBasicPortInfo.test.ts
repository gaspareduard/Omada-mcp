import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetInternetBasicPortInfoTool } from '../../src/tools/getInternetBasicPortInfo.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getInternetBasicPortInfo', () => {
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
            getInternetBasicPortInfo: vi.fn(),
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

    describe('registerGetInternetBasicPortInfoTool', () => {
        it('should register the getInternetBasicPortInfo tool with correct schema', () => {
            registerGetInternetBasicPortInfoTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getInternetBasicPortInfo', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { ports: [] };
            (mockClient.getInternetBasicPortInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInternetBasicPortInfoTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getInternetBasicPortInfo).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { ports: [{ name: 'WAN1' }] };
            (mockClient.getInternetBasicPortInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInternetBasicPortInfoTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getInternetBasicPortInfo).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getInternetBasicPortInfo as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetInternetBasicPortInfoTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getInternetBasicPortInfo',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
