import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetDownlinkWiredDevicesTool } from '../../src/tools/getDownlinkWiredDevices.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getDownlinkWiredDevices', () => {
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
            getDownlinkWiredDevices: vi.fn(),
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

    describe('registerGetDownlinkWiredDevicesTool', () => {
        it('should register the getDownlinkWiredDevices tool with correct schema', () => {
            registerGetDownlinkWiredDevicesTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getDownlinkWiredDevices', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with apMac', async () => {
            const mockData = [{ mac: 'BB-CC-DD-EE-FF-00', name: 'Wired Device' }];
            (mockClient.getDownlinkWiredDevices as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDownlinkWiredDevicesTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getDownlinkWiredDevices).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ mac: 'BB-CC-DD-EE-FF-00' }];
            (mockClient.getDownlinkWiredDevices as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetDownlinkWiredDevicesTool(mockServer, mockClient);

            await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getDownlinkWiredDevices).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getDownlinkWiredDevices as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetDownlinkWiredDevicesTool(mockServer, mockClient);

            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getDownlinkWiredDevices',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
