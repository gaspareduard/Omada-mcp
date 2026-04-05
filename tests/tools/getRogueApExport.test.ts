import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetRogueApExportTool } from '../../src/tools/getRogueApExport.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getRogueApExport', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((_name, _schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getRogueApExport: vi.fn() } as unknown as OmadaClient;
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

    it('should register the getRogueApExport tool', () => {
        registerGetRogueApExportTool(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledWith('getRogueApExport', expect.any(Object), expect.any(Function));
    });

    it('should call getRogueApExport with default format and pagination', async () => {
        const mockData = { data: [] };
        vi.mocked(mockClient.getRogueApExport).mockResolvedValue(mockData);
        registerGetRogueApExportTool(mockServer, mockClient);
        const result = (await toolHandler({ format: '0', page: 1, pageSize: 10 }, { sessionId: 'test' })) as {
            content: { text: string }[];
        };
        expect(mockClient.getRogueApExport).toHaveBeenCalledWith(undefined, '0', 1, 10, undefined);
        expect(JSON.parse(result.content[0].text)).toEqual(mockData);
    });

    it('should pass siteId, excel format and custom pagination', async () => {
        vi.mocked(mockClient.getRogueApExport).mockResolvedValue({});
        registerGetRogueApExportTool(mockServer, mockClient);
        await toolHandler({ siteId: 'site-1', format: '1', page: 2, pageSize: 50 }, { sessionId: 'test' });
        expect(mockClient.getRogueApExport).toHaveBeenCalledWith('site-1', '1', 2, 50, undefined);
    });

    it('should handle errors', async () => {
        vi.mocked(mockClient.getRogueApExport).mockRejectedValue(new Error('fail'));
        registerGetRogueApExportTool(mockServer, mockClient);
        await expect(toolHandler({ format: '0', page: 1, pageSize: 10 }, { sessionId: 'test' })).rejects.toThrow('fail');
    });
});
