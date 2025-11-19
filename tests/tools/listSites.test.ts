import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListSitesTool } from '../../src/tools/listSites.js';
import type { OmadaSiteSummary } from '../../src/types/index.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools/listSites', () => {
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
            listSites: vi.fn(),
        } as unknown as OmadaClient;

        // Mock logger
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

    describe('registerListSitesTool', () => {
        it('should register the listSites tool with correct schema', () => {
            registerListSitesTool(mockServer, mockClient);

            expect(mockServer.registerTool).toHaveBeenCalledWith(
                'listSites',
                {
                    description: 'List all sites configured on the Omada controller.',
                },
                expect.any(Function)
            );
        });

        it('should successfully list sites', async () => {
            const mockSites: OmadaSiteSummary[] = [
                {
                    siteId: 'site-1',
                    name: 'Site 1',
                    type: 0,
                    timeZone: 'UTC',
                    scenario: 'default',
                    deviceCount: 5,
                    networkCount: 2,
                },
                {
                    siteId: 'site-2',
                    name: 'Site 2',
                    type: 0,
                    timeZone: 'UTC',
                    scenario: 'default',
                    deviceCount: 3,
                    networkCount: 1,
                },
            ];

            (mockClient.listSites as ReturnType<typeof vi.fn>).mockResolvedValue(mockSites);

            registerListSitesTool(mockServer, mockClient);

            const result = await toolHandler({}, { sessionId: 'test-session' });

            expect(mockClient.listSites).toHaveBeenCalled();
            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(mockSites, null, 2),
                    },
                ],
            });
            expect(loggerModule.logger.info).toHaveBeenCalledWith('Tool invoked', {
                tool: 'listSites',
                sessionId: 'test-session',
                args: '{}',
            });
            expect(loggerModule.logger.info).toHaveBeenCalledWith('Tool completed', {
                tool: 'listSites',
                sessionId: 'test-session',
            });
        });

        it('should handle errors when listing sites fails', async () => {
            const error = new Error('API error');
            (mockClient.listSites as ReturnType<typeof vi.fn>).mockRejectedValue(error);

            registerListSitesTool(mockServer, mockClient);

            await expect(toolHandler({}, { sessionId: 'test-session' })).rejects.toThrow('API error');

            expect(loggerModule.logger.error).toHaveBeenCalledWith('Tool failed', {
                tool: 'listSites',
                sessionId: 'test-session',
                error: 'API error',
            });
        });

        it('should handle missing sessionId', async () => {
            const mockSites: OmadaSiteSummary[] = [];
            (mockClient.listSites as ReturnType<typeof vi.fn>).mockResolvedValue(mockSites);

            registerListSitesTool(mockServer, mockClient);

            await toolHandler({}, {});

            expect(loggerModule.logger.info).toHaveBeenCalledWith('Tool invoked', {
                tool: 'listSites',
                sessionId: 'unknown-session',
                args: '{}',
            });
        });
    });
});
