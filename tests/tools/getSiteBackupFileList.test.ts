import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteBackupFileListTool } from '../../src/tools/getSiteBackupFileList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteBackupFileList', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getSiteBackupFileList: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetSiteBackupFileListTool', () => {
        it('should register the tool', () => {
            registerGetSiteBackupFileListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteBackupFileList', expect.any(Object), expect.any(Function));
        });

        it('should call getSiteBackupFileList with no args', async () => {
            const mockData = { id: 'files-1' };
            (mockClient.getSiteBackupFileList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteBackupFileListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getSiteBackupFileList).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getSiteBackupFileList as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetSiteBackupFileListTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getSiteBackupFileList).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getSiteBackupFileList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetSiteBackupFileListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
