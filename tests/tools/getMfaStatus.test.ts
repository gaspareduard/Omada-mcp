import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetMfaStatusTool } from '../../src/tools/getMfaStatus.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getMfaStatus', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getMfaStatus: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetMfaStatusTool', () => {
        it('should register the tool', () => {
            registerGetMfaStatusTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getMfaStatus', expect.any(Object), expect.any(Function));
        });

        it('should call getMfaStatus', async () => {
            const mockData = { id: 'mfa-1' };
            (mockClient.getMfaStatus as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetMfaStatusTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getMfaStatus).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getMfaStatus as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetMfaStatusTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
