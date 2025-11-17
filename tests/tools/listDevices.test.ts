import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListDevicesTool } from '../../src/tools/listDevices.js';
import type { OmadaDeviceInfo } from '../../src/types/index.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listDevices', () => {
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
            listDevices: vi.fn(),
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

    describe('registerListDevicesTool', () => {
        it('should register the listDevices tool with correct schema', () => {
            registerListDevicesTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('listDevices', expect.any(Object), expect.any(Function));
        });

        it('should successfully list devices', async () => {
            const mockDevices: OmadaDeviceInfo[] = [
                { mac: '00:11:22:33:44:55', name: 'Device 1', deviceId: 'dev-1' } as OmadaDeviceInfo,
                { mac: '00:11:22:33:44:66', name: 'Device 2', deviceId: 'dev-2' } as OmadaDeviceInfo,
            ];

            (mockClient.listDevices as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevices);

            registerListDevicesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listDevices).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(mockDevices, null, 2),
                    },
                ],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockDevices: OmadaDeviceInfo[] = [];
            (mockClient.listDevices as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevices);

            registerListDevicesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listDevices).toHaveBeenCalledWith('test-site');
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listDevices as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListDevicesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listDevices',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
