import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetClientDetailTool } from '../../src/tools/getClientDetail.js';
import { registerGetClientsDistributionTool } from '../../src/tools/getClientsDistribution.js';
import { registerGetGridClientHistoryTool } from '../../src/tools/getGridClientHistory.js';
import { registerGetGridKnownClientsTool } from '../../src/tools/getGridKnownClients.js';
import { registerGetPastClientNumTool } from '../../src/tools/getPastClientNum.js';
import * as loggerModule from '../../src/utils/logger.js';

describe('tools - client management tools (issue #33)', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const captureHandler = (_name: string, _schema: unknown, handler: typeof toolHandler): void => {
        toolHandler = handler;
    };

    beforeEach(() => {
        mockServer = { registerTool: vi.fn(captureHandler) } as unknown as McpServer;
        mockClient = {
            getClientDetail: vi.fn().mockResolvedValue({ mac: 'AA:BB:CC:DD:EE:FF', ip: '10.0.0.1' }),
            getGridKnownClients: vi.fn().mockResolvedValue({ data: [], totalRows: 0 }),
            getGridClientHistory: vi.fn().mockResolvedValue({ data: [], totalRows: 0 }),
            getClientsDistribution: vi.fn().mockResolvedValue({ wired: 10, wireless: 20 }),
            getPastClientNum: vi.fn().mockResolvedValue([{ time: 1700000000, count: 15 }]),
        } as unknown as OmadaClient;

        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            /* noop */
        });
        vi.spyOn(loggerModule.logger, 'error').mockImplementation(() => {
            /* noop */
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getClientDetail', () => {
        it('should call client with clientMac', async () => {
            registerGetClientDetailTool(mockServer, mockClient);
            const result = await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF' }, {});
            expect(result).toBeDefined();
            expect(mockClient.getClientDetail).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', undefined, undefined);
        });

        it('should pass siteId', async () => {
            registerGetClientDetailTool(mockServer, mockClient);
            await toolHandler({ clientMac: 'AA:BB:CC:DD:EE:FF', siteId: 'site-1' }, {});
            expect(mockClient.getClientDetail).toHaveBeenCalledWith('AA:BB:CC:DD:EE:FF', 'site-1', undefined);
        });
    });

    describe('getGridKnownClients', () => {
        it('should call client with pagination', async () => {
            registerGetGridKnownClientsTool(mockServer, mockClient);
            const result = await toolHandler({ page: 1, pageSize: 10 }, {});
            expect(result).toBeDefined();
            expect(mockClient.getGridKnownClients).toHaveBeenCalledWith(1, 10, expect.any(Object), undefined, undefined);
        });

        it('should pass optional filters', async () => {
            registerGetGridKnownClientsTool(mockServer, mockClient);
            await toolHandler({ page: 1, pageSize: 20, searchKey: 'phone', guest: 'false', siteId: 'site-2' }, {});
            expect(mockClient.getGridKnownClients).toHaveBeenCalledWith(
                1,
                20,
                expect.objectContaining({ searchKey: 'phone', guest: 'false' }),
                'site-2',
                undefined
            );
        });
    });

    describe('getGridClientHistory', () => {
        it('should call client with clientMac and pagination', async () => {
            registerGetGridClientHistoryTool(mockServer, mockClient);
            const result = await toolHandler({ clientMac: 'BB:CC:DD:EE:FF:00', page: 1, pageSize: 10 }, {});
            expect(result).toBeDefined();
            expect(mockClient.getGridClientHistory).toHaveBeenCalledWith('BB:CC:DD:EE:FF:00', 1, 10, undefined, undefined, undefined);
        });

        it('should pass searchKey', async () => {
            registerGetGridClientHistoryTool(mockServer, mockClient);
            await toolHandler({ clientMac: 'BB:CC:DD:EE:FF:00', page: 2, pageSize: 5, searchKey: 'HomeWifi' }, {});
            expect(mockClient.getGridClientHistory).toHaveBeenCalledWith('BB:CC:DD:EE:FF:00', 2, 5, 'HomeWifi', undefined, undefined);
        });
    });

    describe('getClientsDistribution', () => {
        it('should call client', async () => {
            registerGetClientsDistributionTool(mockServer, mockClient);
            const result = await toolHandler({}, {});
            expect(result).toBeDefined();
            expect(mockClient.getClientsDistribution).toHaveBeenCalledWith(undefined, undefined);
        });

        it('should pass siteId', async () => {
            registerGetClientsDistributionTool(mockServer, mockClient);
            await toolHandler({ siteId: 'site-3' }, {});
            expect(mockClient.getClientsDistribution).toHaveBeenCalledWith('site-3', undefined);
        });
    });

    describe('getPastClientNum', () => {
        it('should call client with start and end', async () => {
            registerGetPastClientNumTool(mockServer, mockClient);
            const result = await toolHandler({ start: 1700000000, end: 1700086400 }, {});
            expect(result).toBeDefined();
            expect(mockClient.getPastClientNum).toHaveBeenCalledWith(1700000000, 1700086400, undefined, undefined);
        });

        it('should pass siteId', async () => {
            registerGetPastClientNumTool(mockServer, mockClient);
            await toolHandler({ start: 1700000000, end: 1700086400, siteId: 'site-4' }, {});
            expect(mockClient.getPastClientNum).toHaveBeenCalledWith(1700000000, 1700086400, 'site-4', undefined);
        });
    });
});
