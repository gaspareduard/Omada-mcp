import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetApDetailTool } from '../../src/tools/getApDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getApDetail', () => {
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
            getApDetail: vi.fn(),
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

    describe('registerGetApDetailTool', () => {
        it('should register the getApDetail tool with correct schema', () => {
            registerGetApDetailTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getApDetail', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with apMac', async () => {
            const mockData = { mac: 'AA-BB-CC-DD-EE-FF', name: 'AP-1', model: 'EAP670' };
            (mockClient.getApDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetApDetailTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getApDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { mac: 'AA-BB-CC-DD-EE-FF', name: 'AP-1' };
            (mockClient.getApDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetApDetailTool(mockServer, mockClient);

            await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getApDetail).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getApDetail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetApDetailTool(mockServer, mockClient);

            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getApDetail as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetApDetailTool(mockServer, mockClient);

            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getApDetail',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
