import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetCertificateTool } from '../../src/tools/getCertificate.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getCertificate', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getCertificate: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetCertificateTool', () => {
        it('should register the tool', () => {
            registerGetCertificateTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getCertificate', expect.any(Object), expect.any(Function));
        });

        it('should call getCertificate', async () => {
            const mockData = { id: 'cert-1' };
            (mockClient.getCertificate as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetCertificateTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getCertificate).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getCertificate as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetCertificateTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
