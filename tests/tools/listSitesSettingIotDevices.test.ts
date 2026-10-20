import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListSitesSettingIotDevicesTool } from '../../src/tools/listSitesSettingIotDevices.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listSitesSettingIotDevices', () => {
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
            listSitesSettingIotDevices: vi.fn(),
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

    describe('registerListSitesSettingIotDevicesTool', () => {
        it('should register with correct name', () => {
            registerListSitesSettingIotDevicesTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('listSitesSettingIotDevices', expect.any(Object), expect.any(Function));
        });

        it('should return tool result on success', async () => {
            const mockData = {
                totalRows: 1,
                currentPage: 1,
                currentSize: 10,
                data: [
                    { mac: 'AA-BB-CC-DD-EE-FF', name: 'EAP653', type: 0, showModel: 'EAP653(EU) v1.0', firmwareVersion: '1.0.0', statusCategory: 1 },
                ],
            };
            (mockClient.listSitesSettingIotDevices as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListSitesSettingIotDevicesTool(mockServer, mockClient);

            const result = await toolHandler({ page: 1, pageSize: 10 }, { sessionId: 'test-session' });

            expect(mockClient.listSitesSettingIotDevices).toHaveBeenCalledWith(undefined, 1, 10, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId when provided', async () => {
            (mockClient.listSitesSettingIotDevices as ReturnType<typeof vi.fn>).mockResolvedValue({});

            registerListSitesSettingIotDevicesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'site-1', page: 2, pageSize: 20 }, {});

            expect(mockClient.listSitesSettingIotDevices).toHaveBeenCalledWith('site-1', 2, 20, undefined);
        });

        it('should return empty content on undefined response', async () => {
            (mockClient.listSitesSettingIotDevices as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerListSitesSettingIotDevicesTool(mockServer, mockClient);

            const result = await toolHandler({}, {});

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listSitesSettingIotDevices as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListSitesSettingIotDevicesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('API error');
        });
    });
});
