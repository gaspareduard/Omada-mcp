import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUpgradeOverviewTryBetaTool } from '../../src/tools/getUpgradeOverviewTryBeta.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUpgradeOverviewTryBeta', () => {
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
            getUpgradeOverviewTryBeta: vi.fn(),
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

    describe('registerGetUpgradeOverviewTryBetaTool', () => {
        it('should register with correct name', () => {
            registerGetUpgradeOverviewTryBetaTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getUpgradeOverviewTryBeta', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { enabled: true };
            (mockClient.getUpgradeOverviewTryBeta as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetUpgradeOverviewTryBetaTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getUpgradeOverviewTryBeta).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass customHeaders when provided', async () => {
            (mockClient.getUpgradeOverviewTryBeta as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetUpgradeOverviewTryBetaTool(mockServer, mockClient);

            await toolHandler({ customHeaders: { 'X-Test': 'val' } }, {});

            expect(mockClient.getUpgradeOverviewTryBeta).toHaveBeenCalledWith({ 'X-Test': 'val' });
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getUpgradeOverviewTryBeta as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetUpgradeOverviewTryBetaTool(mockServer, mockClient);

            const result = await toolHandler({}, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getUpgradeOverviewTryBeta as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetUpgradeOverviewTryBetaTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
