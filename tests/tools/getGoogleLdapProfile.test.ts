import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetGoogleLdapProfileTool } from '../../src/tools/getGoogleLdapProfile.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getGoogleLdapProfile', () => {
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
            getGoogleLdapProfile: vi.fn(),
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

    describe('registerGetGoogleLdapProfileTool', () => {
        it('should register the tool', () => {
            registerGetGoogleLdapProfileTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getGoogleLdapProfile', expect.any(Object), expect.any(Function));
        });

        it('should delegate to getGoogleLdapProfile', async () => {
            const mockData = { domain: 'example.com' };
            (mockClient.getGoogleLdapProfile as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetGoogleLdapProfileTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getGoogleLdapProfile).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getGoogleLdapProfile as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetGoogleLdapProfileTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getGoogleLdapProfile).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getGoogleLdapProfile as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetGoogleLdapProfileTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
