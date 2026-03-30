import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetTrafficDistributionTool } from '../../src/tools/getTrafficDistribution.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getTrafficDistribution', () => {
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
            getTrafficDistribution: vi.fn(),
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

    describe('registerGetTrafficDistributionTool', () => {
        it('should register the getTrafficDistribution tool with correct schema', () => {
            registerGetTrafficDistributionTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getTrafficDistribution', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { distribution: [{ category: 'video', bytes: 1000 }] };
            (mockClient.getTrafficDistribution as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetTrafficDistributionTool(mockServer, mockClient);

            const result = await toolHandler({ start: 1682000000, end: 1682086400 }, { sessionId: 'test-session' });

            expect(mockClient.getTrafficDistribution).toHaveBeenCalledWith(undefined, 1682000000, 1682086400, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with siteId', async () => {
            const mockData = { distribution: [{ category: 'gaming', bytes: 500 }] };
            (mockClient.getTrafficDistribution as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetTrafficDistributionTool(mockServer, mockClient);

            const result = await toolHandler({ siteId: 'test-site', start: 1682000000, end: 1682086400 }, { sessionId: 'test-session' });

            expect(mockClient.getTrafficDistribution).toHaveBeenCalledWith('test-site', 1682000000, 1682086400, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getTrafficDistribution as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetTrafficDistributionTool(mockServer, mockClient);

            await expect(toolHandler({ start: 1682000000, end: 1682086400 }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getTrafficDistribution',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
