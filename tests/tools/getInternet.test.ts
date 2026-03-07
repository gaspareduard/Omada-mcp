import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetInternetTool } from '../../src/tools/getInternet.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getInternet', () => {
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
            getInternet: vi.fn(),
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

    describe('registerGetInternetTool', () => {
        it('should register the getInternet tool with correct schema', () => {
            registerGetInternetTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getInternet', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = { wan: { type: 'dhcp' } };
            (mockClient.getInternet as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInternetTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test-session' });
            expect(mockClient.getInternet).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { wan: { type: 'static' } };
            (mockClient.getInternet as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetInternetTool(mockServer, mockClient);
            const result = await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getInternet).toHaveBeenCalledWith('test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getInternet as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetInternetTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getInternet',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
