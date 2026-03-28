import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListUpgradeFirmwaresTool } from '../../src/tools/listUpgradeFirmwares.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listUpgradeFirmwares', () => {
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
            listUpgradeFirmwares: vi.fn(),
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

    describe('registerListUpgradeFirmwaresTool', () => {
        it('should register with correct name', () => {
            registerListUpgradeFirmwaresTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('listUpgradeFirmwares', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = { data: [{ name: 'firmware-1.0.bin', version: '1.0' }] };
            (mockClient.listUpgradeFirmwares as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListUpgradeFirmwaresTool(mockServer, mockClient);

            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' });

            expect(mockClient.listUpgradeFirmwares).toHaveBeenCalledWith(1, 10, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should use default page and pageSize when not provided', async () => {
            (mockClient.listUpgradeFirmwares as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerListUpgradeFirmwaresTool(mockServer, mockClient);

            await toolHandler({}, {});

            expect(mockClient.listUpgradeFirmwares).toHaveBeenCalledWith(1, 10, undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.listUpgradeFirmwares as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerListUpgradeFirmwaresTool(mockServer, mockClient);

            const result = await toolHandler({}, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listUpgradeFirmwares as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListUpgradeFirmwaresTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
