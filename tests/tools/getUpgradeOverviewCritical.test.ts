import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetUpgradeOverviewCriticalTool } from '../../src/tools/getUpgradeOverviewCritical.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getUpgradeOverviewCritical', () => {
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
            getUpgradeOverviewCritical: vi.fn(),
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

    describe('registerGetUpgradeOverviewCriticalTool', () => {
        it('should register with correct name', () => {
            registerGetUpgradeOverviewCriticalTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getUpgradeOverviewCritical', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { criticalCount: 3 };
            (mockClient.getUpgradeOverviewCritical as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetUpgradeOverviewCriticalTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getUpgradeOverviewCritical).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass customHeaders when provided', async () => {
            (mockClient.getUpgradeOverviewCritical as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerGetUpgradeOverviewCriticalTool(mockServer, mockClient);

            await toolHandler({ customHeaders: { 'X-Test': 'val' } }, {});

            expect(mockClient.getUpgradeOverviewCritical).toHaveBeenCalledWith({ 'X-Test': 'val' });
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.getUpgradeOverviewCritical as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetUpgradeOverviewCriticalTool(mockServer, mockClient);

            const result = await toolHandler({}, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getUpgradeOverviewCritical as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetUpgradeOverviewCriticalTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
