import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSwitchVlanInterfaceTool } from '../../src/tools/getSwitchVlanInterface.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSwitchVlanInterface', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_, __, h) => {
                toolHandler = h;
            }),
        } as unknown as McpServer;
        mockClient = { getSwitchVlanInterface: vi.fn() } as unknown as OmadaClient;
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

    it('should register the tool', () => {
        registerGetSwitchVlanInterfaceTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getSwitchVlanInterface', expect.any(Object), expect.any(Function));
    });

    it('should execute with switchMac', async () => {
        const mockData = { vlans: [] };
        (mockClient.getSwitchVlanInterface as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
        registerGetSwitchVlanInterfaceTool(mockServer, mockClient);
        const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' });
        expect(mockClient.getSwitchVlanInterface).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
    });

    it('should pass siteId', async () => {
        (mockClient.getSwitchVlanInterface as ReturnType<typeof vi.fn>).mockResolvedValue({});
        registerGetSwitchVlanInterfaceTool(mockServer, mockClient);
        await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF', siteId: 'site-1' }, { sessionId: 'test' });
        expect(mockClient.getSwitchVlanInterface).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'site-1', undefined);
    });

    it('should handle errors', async () => {
        (mockClient.getSwitchVlanInterface as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        registerGetSwitchVlanInterfaceTool(mockServer, mockClient);
        await expect(toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
