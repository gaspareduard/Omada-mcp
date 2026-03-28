import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListUpgradeOverviewFirmwaresTool } from '../../src/tools/listUpgradeOverviewFirmwares.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listUpgradeOverviewFirmwares', () => {
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
            listUpgradeOverviewFirmwares: vi.fn(),
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

    describe('registerListUpgradeOverviewFirmwaresTool', () => {
        it('should register with correct name', () => {
            registerListUpgradeOverviewFirmwaresTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('listUpgradeOverviewFirmwares', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { data: [{ model: 'EAP670', latestVersion: '2.0' }] };
            (mockClient.listUpgradeOverviewFirmwares as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListUpgradeOverviewFirmwaresTool(mockServer, mockClient);

            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' });

            expect(mockClient.listUpgradeOverviewFirmwares).toHaveBeenCalledWith(1, 10, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should use default page and pageSize when not provided', async () => {
            (mockClient.listUpgradeOverviewFirmwares as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerListUpgradeOverviewFirmwaresTool(mockServer, mockClient);

            await toolHandler({}, {});

            expect(mockClient.listUpgradeOverviewFirmwares).toHaveBeenCalledWith(1, 10, undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.listUpgradeOverviewFirmwares as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerListUpgradeOverviewFirmwaresTool(mockServer, mockClient);

            const result = await toolHandler({}, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listUpgradeOverviewFirmwares as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListUpgradeOverviewFirmwaresTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
