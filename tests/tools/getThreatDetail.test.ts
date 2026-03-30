import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetThreatDetailTool } from '../../src/tools/getThreatDetail.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getThreatDetail', () => {
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
            getThreatDetail: vi.fn(),
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

    describe('registerGetThreatDetailTool', () => {
        it('should register the getThreatDetail tool with correct schema', () => {
            registerGetThreatDetailTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getThreatDetail', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with threatId and time', async () => {
            const mockData = { id: 'threat-123', severity: 'high', description: 'SQL injection attempt' };
            (mockClient.getThreatDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetThreatDetailTool(mockServer, mockClient);
            const result = await toolHandler({ threatId: 'threat-123', time: 1682000000 }, { sessionId: 'test-session' });
            expect(mockClient.getThreatDetail).toHaveBeenCalledWith('threat-123', 1682000000, undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with threatId, time, and siteId', async () => {
            const mockData = { id: 'threat-456', severity: 'critical' };
            (mockClient.getThreatDetail as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetThreatDetailTool(mockServer, mockClient);
            const result = await toolHandler({ threatId: 'threat-456', time: 1682000000, siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getThreatDetail).toHaveBeenCalledWith('threat-456', 1682000000, 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getThreatDetail as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetThreatDetailTool(mockServer, mockClient);
            await expect(toolHandler({ threatId: 'threat-123', time: 1682000000 }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getThreatDetail',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
