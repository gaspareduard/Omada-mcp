import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPastClientNumTool } from '../../src/tools/getPastClientNum.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getPastClientNum', () => {
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
            getPastClientNum: vi.fn(),
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

    describe('registerGetPastClientNumTool', () => {
        it('should register the getPastClientNum tool with correct schema', () => {
            registerGetPastClientNumTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getPastClientNum', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with required start and end', async () => {
            const mockData = [{ timestamp: 1700000000, clientCount: 42 }];
            (mockClient.getPastClientNum as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPastClientNumTool(mockServer, mockClient);
            const result = await toolHandler({ start: 1700000000, end: 1700086400 }, { sessionId: 'test-session' });
            expect(mockClient.getPastClientNum).toHaveBeenCalledWith(1700000000, 1700086400, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = [{ timestamp: 1700000000, clientCount: 10 }];
            (mockClient.getPastClientNum as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetPastClientNumTool(mockServer, mockClient);
            await toolHandler({ start: 1700000000, end: 1700086400, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getPastClientNum).toHaveBeenCalledWith(1700000000, 1700086400, 'test-site', undefined);
        });

        it('should return empty content when result is undefined', async () => {
            (mockClient.getPastClientNum as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
            registerGetPastClientNumTool(mockServer, mockClient);
            const result = await toolHandler({ start: 1700000000, end: 1700086400 }, { sessionId: 'test-session' });
            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getPastClientNum as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetPastClientNumTool(mockServer, mockClient);
            await expect(toolHandler({ start: 1700000000, end: 1700086400 }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getPastClientNum',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
