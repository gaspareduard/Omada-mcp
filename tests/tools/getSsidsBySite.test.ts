import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSsidsBySiteTool } from '../../src/tools/getSsidsBySite.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSsidsBySite', () => {
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
            getSsidsBySite: vi.fn(),
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

    describe('registerGetSsidsBySiteTool', () => {
        it('should register the getSsidsBySite tool with correct schema', () => {
            registerGetSsidsBySiteTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSsidsBySite', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with type=1 (AP only)', async () => {
            const mockData = { result: { data: [{ ssid: 'Network1' }] } };
            (mockClient.getSsidsBySite as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSsidsBySiteTool(mockServer, mockClient);
            const result = await toolHandler({ type: 1 }, { sessionId: 'test-session' });
            expect(mockClient.getSsidsBySite).toHaveBeenCalledWith(1, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with type=2 and siteId', async () => {
            const mockData = { result: { data: [] } };
            (mockClient.getSsidsBySite as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSsidsBySiteTool(mockServer, mockClient);
            const result = await toolHandler({ type: 2, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getSsidsBySite).toHaveBeenCalledWith(2, 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with type=3 (AP and wireless router)', async () => {
            const mockData = { result: { data: [{ ssid: 'Network1' }, { ssid: 'Network2' }] } };
            (mockClient.getSsidsBySite as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSsidsBySiteTool(mockServer, mockClient);
            const result = await toolHandler({ type: 3 }, { sessionId: 'test-session' });
            expect(mockClient.getSsidsBySite).toHaveBeenCalledWith(3, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSsidsBySite as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetSsidsBySiteTool(mockServer, mockClient);
            await expect(toolHandler({ type: 1 }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSsidsBySite',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
