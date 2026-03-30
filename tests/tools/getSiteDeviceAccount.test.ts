import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteDeviceAccountTool } from '../../src/tools/getSiteDeviceAccount.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteDeviceAccount', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getSiteDeviceAccount: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetSiteDeviceAccountTool', () => {
        it('should register the tool', () => {
            registerGetSiteDeviceAccountTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteDeviceAccount', expect.any(Object), expect.any(Function));
        });

        it('should call getSiteDeviceAccount with no args', async () => {
            const mockData = { id: 'account-1' };
            (mockClient.getSiteDeviceAccount as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteDeviceAccountTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getSiteDeviceAccount).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getSiteDeviceAccount as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetSiteDeviceAccountTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getSiteDeviceAccount).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getSiteDeviceAccount as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetSiteDeviceAccountTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
