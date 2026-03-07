import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetCableTestFullResultsTool } from '../../src/tools/getCableTestFullResults.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getCableTestFullResults', () => {
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
            getCableTestFullResults: vi.fn(),
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

    describe('registerGetCableTestFullResultsTool', () => {
        it('should register the getCableTestFullResults tool with correct schema', () => {
            registerGetCableTestFullResultsTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getCableTestFullResults', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with switchMac', async () => {
            const mockData = { ports: [{ port: 1, status: 'OK', length: 50 }] };
            (mockClient.getCableTestFullResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetCableTestFullResultsTool(mockServer, mockClient);

            const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(mockClient.getCableTestFullResults).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { ports: [] };
            (mockClient.getCableTestFullResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetCableTestFullResultsTool(mockServer, mockClient);

            await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getCableTestFullResults).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getCableTestFullResults as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetCableTestFullResultsTool(mockServer, mockClient);

            const result = await toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getCableTestFullResults as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetCableTestFullResultsTool(mockServer, mockClient);

            await expect(toolHandler({ switchMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getCableTestFullResults',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
