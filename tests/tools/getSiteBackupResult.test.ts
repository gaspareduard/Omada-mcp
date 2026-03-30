import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteBackupResultTool } from '../../src/tools/getSiteBackupResult.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteBackupResult', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getSiteBackupResult: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetSiteBackupResultTool', () => {
        it('should register the tool', () => {
            registerGetSiteBackupResultTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteBackupResult', expect.any(Object), expect.any(Function));
        });

        it('should call getSiteBackupResult with no args', async () => {
            const mockData = { id: 'result-1' };
            (mockClient.getSiteBackupResult as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteBackupResultTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getSiteBackupResult).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getSiteBackupResult as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetSiteBackupResultTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getSiteBackupResult).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getSiteBackupResult as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetSiteBackupResultTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
