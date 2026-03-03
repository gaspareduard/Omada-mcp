import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDeviceTool } from '../../src/tools/getDevice.js';
import type { OmadaDeviceInfo } from '../../src/types/index.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDevice', () => {
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
            getDevice: vi.fn(),
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

    describe('registerGetDeviceTool', () => {
        it('should register the getDevice tool with correct schema', () => {
            registerGetDeviceTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getDevice', expect.any(Object), expect.any(Function));
        });

        it('should successfully get device by MAC', async () => {
            const mockDevice: OmadaDeviceInfo = {
                mac: '00:11:22:33:44:55',
                name: 'Device 1',
                deviceId: 'dev-1',
            } as OmadaDeviceInfo;

            (mockClient.getDevice as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevice);

            registerGetDeviceTool(mockServer, mockClient);

            const result = await toolHandler({ deviceId: '00:11:22:33:44:55' }, { sessionId: 'test-session' });

            expect(mockClient.getDevice).toHaveBeenCalledWith('00:11:22:33:44:55', undefined, undefined);
            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(mockDevice, null, 2),
                    },
                ],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockDevice: OmadaDeviceInfo = {
                mac: '00:11:22:33:44:55',
                name: 'Device 1',
                deviceId: 'dev-1',
            } as OmadaDeviceInfo;

            (mockClient.getDevice as ReturnType<typeof vi.fn>).mockResolvedValue(mockDevice);

            registerGetDeviceTool(mockServer, mockClient);

            await toolHandler({ deviceId: 'dev-1', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDevice).toHaveBeenCalledWith('dev-1', 'test-site', undefined);
        });

        it('should handle device not found', async () => {
            (mockClient.getDevice as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetDeviceTool(mockServer, mockClient);

            const result = await toolHandler({ deviceId: 'nonexistent' }, { sessionId: 'test-session' });

            expect(result).toEqual({
                content: [],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDevice as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDeviceTool(mockServer, mockClient);

            await expect(toolHandler({ deviceId: 'dev-1' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDevice',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
