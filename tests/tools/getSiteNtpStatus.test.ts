import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSiteNtpStatusTool } from '../../src/tools/getSiteNtpStatus.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSiteNtpStatus', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getSiteNtpStatus: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetSiteNtpStatusTool', () => {
        it('should register the tool', () => {
            registerGetSiteNtpStatusTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSiteNtpStatus', expect.any(Object), expect.any(Function));
        });

        it('should call getSiteNtpStatus with no args', async () => {
            const mockData = { id: 'ntp-1' };
            (mockClient.getSiteNtpStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSiteNtpStatusTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getSiteNtpStatus).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should pass siteId', async () => {
            (mockClient.getSiteNtpStatus as ReturnType<typeof vi.fn>).mockResolvedValue({});
            registerGetSiteNtpStatusTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-1' }, { sessionId: 'test' });
            expect(mockClient.getSiteNtpStatus).toHaveBeenCalledWith('site-1', undefined);
        });

        it('should handle errors', async () => {
            (mockClient.getSiteNtpStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetSiteNtpStatusTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
