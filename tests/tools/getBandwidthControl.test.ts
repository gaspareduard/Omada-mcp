import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetBandwidthControlTool } from '../../src/tools/getBandwidthControl.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getBandwidthControl', () => {
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
            getBandwidthControl: vi.fn(),
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

    describe('registerGetBandwidthControlTool', () => {
        it('should register the getBandwidthControl tool with correct schema', () => {
            registerGetBandwidthControlTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith('getBandwidthControl', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully', async () => {
            const mockData = { enabled: true, defaultPolicy: 'limit' };
            (mockClient.getBandwidthControl as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetBandwidthControlTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.getBandwidthControl).toHaveBeenCalledWith(undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should pass siteId when provided', async () => {
            const mockData = { enabled: true };
            (mockClient.getBandwidthControl as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

            registerGetBandwidthControlTool(mockServer, mockClient);

            await toolHandler({ siteId: 'test-site' }, { sessionId: 'test-session' });

            expect(mockClient.getBandwidthControl).toHaveBeenCalledWith('test-site', undefined);
        });

        it('should handle empty response', async () => {
            (mockClient.getBandwidthControl as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

            registerGetBandwidthControlTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(result).toEqual({ content: [] });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getBandwidthControl as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerGetBandwidthControlTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getBandwidthControl',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
