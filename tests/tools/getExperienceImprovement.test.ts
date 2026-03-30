import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetExperienceImprovementTool } from '../../src/tools/getExperienceImprovement.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/getExperienceImprovement', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;
        mockClient = { getExperienceImprovement: vi.fn() } as unknown as OmadaClient;
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

    describe('registerGetExperienceImprovementTool', () => {
        it('should register the tool', () => {
            registerGetExperienceImprovementTool(mockServer, mockClient);
            expect(mockServer.registerTool).toHaveBeenCalledWith('getExperienceImprovement', expect.any(Object), expect.any(Function));
        });

        it('should call getExperienceImprovement', async () => {
            const mockData = { id: 'exp-1' };
            (mockClient.getExperienceImprovement as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);
            registerGetExperienceImprovementTool(mockServer, mockClient);
            const result = await toolHandler({}, { sessionId: 'test' });
            expect(mockClient.getExperienceImprovement).toHaveBeenCalledWith(undefined);
            expect(result).toEqual({ content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }] });
        });

        it('should handle errors', async () => {
            (mockClient.getExperienceImprovement as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
            registerGetExperienceImprovementTool(mockServer, mockClient);
            await expect(toolHandler({}, { sessionId: 'test' })).rejects.toThrow('fail');
        });
    });
});
