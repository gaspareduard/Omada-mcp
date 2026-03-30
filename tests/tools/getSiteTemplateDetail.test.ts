import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteTemplateDetailTool } from '../../src/tools/getSiteTemplateDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteTemplateDetail', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getSiteTemplateDetail: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetSiteTemplateDetailTool', () => {
        it('should register the tool', () => {
            registerGetSiteTemplateDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteTemplateDetail', expect.any(Object), expect.any(Function));
        });

        it('should call getSiteTemplateDetail with siteTemplateId', async () => {
            const mockData = { id: 'tmpl-1' };
            (mockClient.getSiteTemplateDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteTemplateDetailTool(mockServer, mockClient);
            const result = await toolHandler({ siteTemplateId: 'tmpl-1' }, { sessionId: 'test' });
            expect(mockClient.getSiteTemplateDetail).toHaveBeenCalledWith('tmpl-1', undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getSiteTemplateDetail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetSiteTemplateDetailTool(mockServer, mockClient);
            await expect(toolHandler({ siteTemplateId: 'tmpl-1' }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
