import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteTemplateConfigTool } from '../../src/tools/getSiteTemplateConfig.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteTemplateConfig', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getSiteTemplateConfig: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetSiteTemplateConfigTool', () => {
        it('should register the tool', () => {
            registerGetSiteTemplateConfigTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteTemplateConfig', expect.any(Object), expect.any(Function));
        });

        it('should call getSiteTemplateConfig with siteTemplateId', async () => {
            const mockData = { id: 'tmpl-1' };
            (mockClient.getSiteTemplateConfig as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteTemplateConfigTool(mockServer, mockClient);
            const result = await toolHandler({ siteTemplateId: 'tmpl-1' }, { sessionId: 'test' });
            expect(mockClient.getSiteTemplateConfig).toHaveBeenCalledWith('tmpl-1', undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getSiteTemplateConfig as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetSiteTemplateConfigTool(mockServer, mockClient);
            await expect(toolHandler({ siteTemplateId: 'tmpl-1' }, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
