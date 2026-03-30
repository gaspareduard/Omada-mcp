import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteTemplateListTool } from '../../src/tools/getSiteTemplateList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteTemplateList', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getSiteTemplateList: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetSiteTemplateListTool', () => {
        it('should register the tool', () => {
            registerGetSiteTemplateListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteTemplateList', expect.any(Object), expect.any(Function));
        });

        it('should call getSiteTemplateList', async () => {
            const mockData = { id: 'tmpl-1' };
            (mockClient.getSiteTemplateList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteTemplateListTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getSiteTemplateList).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getSiteTemplateList as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetSiteTemplateListTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
