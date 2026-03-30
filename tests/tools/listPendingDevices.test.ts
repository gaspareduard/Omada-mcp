import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListPendingDevicesTool } from '../../src/tools/listPendingDevices.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listPendingDevices', () => {
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
            listPendingDevices: vi.fn(),
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

    describe('registerListPendingDevicesTool', () => {
        it('should register the listPendingDevices tool with correct schema', () => {
            registerListPendingDevicesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('listPendingDevices', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with no args', async () => {
            const mockData = [{ mac: 'AA:BB:CC:DD:EE:FF', model: 'EAP670', type: 'ap' }];
            (mockClient.listPendingDevices as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListPendingDevicesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listPendingDevices).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ mac: 'AA:BB:CC:DD:EE:FF', model: 'EAP670', type: 'ap' }];
            (mockClient.listPendingDevices as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerListPendingDevicesTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.listPendingDevices).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.listPendingDevices as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListPendingDevicesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listPendingDevices',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
