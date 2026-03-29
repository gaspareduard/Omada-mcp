import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetLanProfileEsUsageTool } from '../../src/tools/getLanProfileEsUsage.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getLanProfileEsUsage', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_, __, h) => {
                toolHandler = h;
            }),
        } as unknown as McpServer;
        mockClient = { getLanProfileEsUsage: vi.fn() } as unknown as OmadaClient;
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
        registerGetLanProfileEsUsageTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getLanProfileEsUsage', expect.any(Object), expect.any(Function));
    });

    it('should execute with profileId', async () => {
        const mockData = { devices: [] };
        (mockClient.getLanProfileEsUsage as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
        registerGetLanProfileEsUsageTool(mockServer, mockClient);
        const result = await toolHandler({ profileId: 'profile-1' }, { sessionId: 'test' });
        expect(mockClient.getLanProfileEsUsage).toHaveBeenCalledWith('profile-1', undefined, undefined);
        expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
    });

    it('should pass siteId', async () => {
        (mockClient.getLanProfileEsUsage as ReturnType<typeof vi.fn>).mockResolvedValue({});
        registerGetLanProfileEsUsageTool(mockServer, mockClient);
        await toolHandler({ profileId: 'profile-1', siteId: 'site-1' }, { sessionId: 'test' });
        expect(mockClient.getLanProfileEsUsage).toHaveBeenCalledWith('profile-1', 'site-1', undefined);
    });

    it('should handle errors', async () => {
        (mockClient.getLanProfileEsUsage as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
        registerGetLanProfileEsUsageTool(mockServer, mockClient);
        await expect(toolHandler({ profileId: 'profile-1' }, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
