import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetFirmwareInfoTool } from '../../src/tools/getFirmwareInfo.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getFirmwareInfo', () => {
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
            getFirmwareInfo: vi.fn(),
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

    describe('registerGetFirmwareInfoTool', () => {
        it('should register the getFirmwareInfo tool with correct schema', () => {
            registerGetFirmwareInfoTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getFirmwareInfo', expect.any(Object), expect.any(Function));
        });

        it('should successfully get firmware info for a device', async () => {
            const mockData = { currentVersion: '1.0.0', latestVersion: '1.1.0', upgradeAvailable: true };

            (mockClient.getFirmwareInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetFirmwareInfoTool(mockServer, mockClient);

            const result = await toolHandler({ deviceMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getFirmwareInfo).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { currentVersion: '1.0.0', latestVersion: '1.0.0', upgradeAvailable: false };

            (mockClient.getFirmwareInfo as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetFirmwareInfoTool(mockServer, mockClient);

            await toolHandler({ deviceMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getFirmwareInfo).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle undefined response', async () => {
            (mockClient.getFirmwareInfo as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetFirmwareInfoTool(mockServer, mockClient);

            const result = await toolHandler({ deviceMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getFirmwareInfo as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetFirmwareInfoTool(mockServer, mockClient);

            await expect(toolHandler({ deviceMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getFirmwareInfo',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
