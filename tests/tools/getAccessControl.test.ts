import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetAccessControlTool } from '../../src/tools/getAccessControl.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getAccessControl', () => {
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
            getAccessControl: vi.fn(),
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

    describe('registerGetAccessControlTool', () => {
        it('should register the getAccessControl tool with correct schema', () => {
            registerGetAccessControlTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getAccessControl', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { enabled: true, allowedRanges: [] };
            (mockClient.getAccessControl as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAccessControlTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getAccessControl).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: true, allowedRanges: [] };
            (mockClient.getAccessControl as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetAccessControlTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getAccessControl).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getAccessControl as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetAccessControlTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getAccessControl as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetAccessControlTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getAccessControl',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
