import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetThreatListTool } from '../../src/tools/getThreatList.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getThreatList', () => {
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
            getThreatList: vi.fn(),
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

    describe('registerGetThreatListTool', () => {
        it('should register the getThreatList tool with correct schema', () => {
            registerGetThreatListTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getThreatList', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required args', async () => {
            const mockData = { result: [{ id: 'threat-1', severity: 0 }] };
            (mockClient.getThreatList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetThreatListTool(mockServer, mockClient);

            const result = await toolHandler({ archived: false, startTime: 1682000000, endTime: 1682086400 }, { sessionId: 'test-session' });

            expect(mockClient.getThreatList).toHaveBeenCalledWith(
                {
                    siteList: undefined,
                    archived: false,
                    page: undefined,
                    pageSize: undefined,
                    startTime: 1682000000,
                    endTime: 1682086400,
                    severity: undefined,
                    sortTime: undefined,
                    searchKey: undefined,
                },
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with all optional args', async () => {
            const mockData = { result: [{ id: 'threat-1', severity: 1 }] };
            (mockClient.getThreatList as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetThreatListTool(mockServer, mockClient);

            const result = await toolHandler(
                {
                    siteList: 'site-1,site-2',
                    archived: true,
                    page: 2,
                    pageSize: 20,
                    startTime: 1682000000,
                    endTime: 1682086400,
                    severity: 1,
                    sortTime: 'desc',
                    searchKey: 'malware',
                },
                { sessionId: 'test-session' }
            );

            expect(mockClient.getThreatList).toHaveBeenCalledWith(
                {
                    siteList: 'site-1,site-2',
                    archived: true,
                    page: 2,
                    pageSize: 20,
                    startTime: 1682000000,
                    endTime: 1682086400,
                    severity: 1,
                    sortTime: 'desc',
                    searchKey: 'malware',
                },
                undefined
            );
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getThreatList as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetThreatListTool(mockServer, mockClient);

            await expect(toolHandler({ archived: false, startTime: 1682000000, endTime: 1682086400 }, { sessionId: 'test-session' })).rejects.toThrow(
                'API error'
            );

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getThreatList',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
