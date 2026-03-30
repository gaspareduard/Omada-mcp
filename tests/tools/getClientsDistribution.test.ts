import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientsDistributionTool } from '../../src/tools/getClientsDistribution.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getClientsDistribution', () => {
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
            getClientsDistribution: vi.fn(),
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

    describe('registerGetClientsDistributionTool', () => {
        it('should register the getClientsDistribution tool with correct schema', () => {
            registerGetClientsDistributionTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getClientsDistribution', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully without siteId', async () => {
            const mockData = { wired: 10, wireless24g: 5, wireless5g: 8 };
            (mockClient.getClientsDistribution as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetClientsDistributionTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getClientsDistribution).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { wired: 10 };
            (mockClient.getClientsDistribution as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetClientsDistributionTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getClientsDistribution).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getClientsDistribution as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetClientsDistributionTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getClientsDistribution',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
