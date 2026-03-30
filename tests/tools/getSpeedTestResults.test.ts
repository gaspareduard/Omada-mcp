import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetSpeedTestResultsTool } from '../../src/tools/getSpeedTestResults.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getSpeedTestResults', () => {
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
            getSpeedTestResults: vi.fn(),
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

    describe('registerGetSpeedTestResultsTool', () => {
        it('should register the getSpeedTestResults tool with correct schema', () => {
            registerGetSpeedTestResultsTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getSpeedTestResults', expect.any(Object), expect.any(Function));
        });

        it('should execute successfully with apMac', async () => {
            const mockData = { upload: 100, download: 200 };
            (mockClient.getSpeedTestResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSpeedTestResultsTool(mockServer, mockClient);
            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' });
            expect(mockClient.getSpeedTestResults).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', undefined, undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should execute successfully with apMac and siteId', async () => {
            const mockData = { upload: 150, download: 300 };
            (mockClient.getSpeedTestResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetSpeedTestResultsTool(mockServer, mockClient);
            const result = await toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF', siteId: 'test-site' }, { sessionId: 'test-session' });
            expect(mockClient.getSpeedTestResults).toHaveBeenCalledWith('AA-BB-CC-DD-EE-FF', 'test-site', undefined);
            expect(result).toEqual({
                content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
            });
        });

        it('should handle errors', async () => {
            const error = new Error('API error');
            (mockClient.getSpeedTestResults as ReturnType<typeof vi.fn>).mockRejectedValue(error);
            registerGetSpeedTestResultsTool(mockServer, mockClient);
            await expect(toolHandler({ apMac: 'AA-BB-CC-DD-EE-FF' }, { sessionId: 'test-session' })).rejects.toThrow('API error');
            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'getSpeedTestResults',
                sessionId: 'test-session',
                error: 'API error',
            });
        });
    });
});
