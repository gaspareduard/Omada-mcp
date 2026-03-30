import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRadiusProxyConfigTool } from '../../src/tools/getRadiusProxyConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRadiusProxyConfig', () => {
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
            getRadiusProxyConfig: vi.fn(),
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

    describe('registerGetRadiusProxyConfigTool', () => {
        it('should register the getRadiusProxyConfig tool', () => {
            registerGetRadiusProxyConfigTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getRadiusProxyConfig', expect.any(Object), expect.any(Function));
        });

        it('should execute and return result', async () => {
            const mockData = { enabled: true, port: 1812 };
            (mockClient.getRadiusProxyConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetRadiusProxyConfigTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getRadiusProxyConfig).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle empty response', async () => {
            (mockClient.getRadiusProxyConfig as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetRadiusProxyConfigTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getRadiusProxyConfig as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetRadiusProxyConfigTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
