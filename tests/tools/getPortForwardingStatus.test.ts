import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerGetPortForwardingStatusTool } from '../../src/tools/getPortForwardingStatus.js';
import type { PaginatedResult } from '../../src/types/index.js';

interface MockServerWithTools extends McpServer {
    registerTool: ReturnType<typeof vi.fn>;
    getRegisteredTool: (name: string) => { schema: unknown; handler: CallableFunction } | undefined;
}

describe('getPortForwardingStatus Tool', () => {
    const createMockClient = () => {
        return {
            getPortForwardingStatus: vi.fn(),
        } as unknown as OmadaClient;
    };

    const createMockServer = () => {
        const registeredTools = new Map<string, { schema: unknown; handler: CallableFunction }>();
        return {
            registerTool: vi.fn((name: string, schema: unknown, handler: unknown) => {
                registeredTools.set(name, { schema, handler: handler as CallableFunction });
            }),
            getRegisteredTool: (name: string) => registeredTools.get(name),
        } as unknown as MockServerWithTools;
    };

    it('should register the tool with correct schema', () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        expect(mockServer.registerTool).toHaveBeenCalledWith(
            'getPortForwardingStatus',
            expect.objectContaining({
                description: expect.stringContaining('Get port forwarding status'),
                inputSchema: expect.objectContaining({
                    type: expect.any(Object),
                    siteId: expect.any(Object),
                    page: expect.any(Object),
                    pageSize: expect.any(Object),
                }),
            }),
            expect.any(Function)
        );
    });

    it('should call client.getPortForwardingStatus with User type', async () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        const mockResponse: PaginatedResult<unknown> = {
            totalRows: 1,
            currentPage: 1,
            currentSize: 10,
            data: [{ id: 'rule1', name: 'Test Rule' }],
        };

        vi.mocked(mockClient.getPortForwardingStatus).mockResolvedValue(mockResponse);

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        const toolData = mockServer.getRegisteredTool('getPortForwardingStatus');
        if (!toolData) throw new Error('Tool not registered');

        const result = await toolData.handler({ type: 'User', siteId: 'test-site', page: 1, pageSize: 10 }, { sessionId: 'test-session' });

        expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('user', 'test-site', 1, 10, undefined);
        expect(result).toEqual({
            content: [{ type: 'text', text: JSON.stringify(mockResponse, null, 2) }],
        });
    });

    it('should call client.getPortForwardingStatus with UPnP type', async () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        const mockResponse: PaginatedResult<unknown> = {
            totalRows: 2,
            currentPage: 1,
            currentSize: 10,
            data: [
                { id: 'upnp1', name: 'UPnP Rule 1' },
                { id: 'upnp2', name: 'UPnP Rule 2' },
            ],
        };

        vi.mocked(mockClient.getPortForwardingStatus).mockResolvedValue(mockResponse);

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        const toolData = mockServer.getRegisteredTool('getPortForwardingStatus');
        if (!toolData) throw new Error('Tool not registered');

        const result = await toolData.handler({ type: 'UPnP', siteId: 'test-site', page: 1, pageSize: 10 }, { sessionId: 'test-session' });

        expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('upnp', 'test-site', 1, 10, undefined);
        expect(result).toEqual({
            content: [{ type: 'text', text: JSON.stringify(mockResponse, null, 2) }],
        });
    });

    it('should normalise type "user" (lowercase) to "User"', async () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        vi.mocked(mockClient.getPortForwardingStatus).mockResolvedValue({
            totalRows: 0,
            currentPage: 1,
            currentSize: 10,
            data: [],
        });

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        const toolData = mockServer.getRegisteredTool('getPortForwardingStatus');
        if (!toolData) throw new Error('Tool not registered');

        await toolData.handler({ type: 'user', siteId: 'test-site' }, { sessionId: 'test-session' });

        expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('user', 'test-site', 1, 10, undefined);
    });

    it('should normalise type "upnp" (lowercase) to "UPnP"', async () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        vi.mocked(mockClient.getPortForwardingStatus).mockResolvedValue({
            totalRows: 0,
            currentPage: 1,
            currentSize: 10,
            data: [],
        });

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        const toolData = mockServer.getRegisteredTool('getPortForwardingStatus');
        if (!toolData) throw new Error('Tool not registered');

        await toolData.handler({ type: 'upnp', siteId: 'test-site' }, { sessionId: 'test-session' });

        expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('upnp', 'test-site', 1, 10, undefined);
    });

    it('should normalise type "UPNP" (uppercase) to "UPnP"', async () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        vi.mocked(mockClient.getPortForwardingStatus).mockResolvedValue({
            totalRows: 0,
            currentPage: 1,
            currentSize: 10,
            data: [],
        });

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        const toolData = mockServer.getRegisteredTool('getPortForwardingStatus');
        if (!toolData) throw new Error('Tool not registered');

        await toolData.handler({ type: 'UPNP', siteId: 'test-site' }, { sessionId: 'test-session' });

        expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('upnp', 'test-site', 1, 10, undefined);
    });

    it('should return an error result for invalid type values', async () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        const toolData = mockServer.getRegisteredTool('getPortForwardingStatus');
        if (!toolData) throw new Error('Tool not registered');

        const result = await toolData.handler({ type: 'invalid', siteId: 'test-site' }, { sessionId: 'test-session' });

        expect(result).toMatchObject({ isError: true });
        expect(mockClient.getPortForwardingStatus).not.toHaveBeenCalled();
    });

    it('should use default pagination values when not provided', async () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        vi.mocked(mockClient.getPortForwardingStatus).mockResolvedValue({
            totalRows: 0,
            currentPage: 1,
            currentSize: 10,
            data: [],
        });

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        const toolData = mockServer.getRegisteredTool('getPortForwardingStatus');
        if (!toolData) throw new Error('Tool not registered');

        await toolData.handler({ type: 'User', siteId: 'test-site' }, { sessionId: 'test-session' });

        expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('user', 'test-site', 1, 10, undefined);
    });

    it('should handle custom pagination parameters', async () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        vi.mocked(mockClient.getPortForwardingStatus).mockResolvedValue({
            totalRows: 100,
            currentPage: 2,
            currentSize: 50,
            data: [],
        });

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        const toolData = mockServer.getRegisteredTool('getPortForwardingStatus');
        if (!toolData) throw new Error('Tool not registered');

        await toolData.handler({ type: 'User', siteId: 'test-site', page: 2, pageSize: 50 }, { sessionId: 'test-session' });

        expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('user', 'test-site', 2, 50, undefined);
    });

    it('should propagate errors from the client', async () => {
        const mockClient = createMockClient();
        const mockServer = createMockServer();

        vi.mocked(mockClient.getPortForwardingStatus).mockRejectedValue(new Error('API error: Invalid request parameters'));

        registerGetPortForwardingStatusTool(mockServer, mockClient);

        const toolData = mockServer.getRegisteredTool('getPortForwardingStatus');
        if (!toolData) throw new Error('Tool not registered');

        await expect(toolData.handler({ type: 'User', siteId: 'test-site', page: 1, pageSize: 10 }, { sessionId: 'test-session' })).rejects.toThrow(
            'API error: Invalid request parameters'
        );

        expect(mockClient.getPortForwardingStatus).toHaveBeenCalledWith('user', 'test-site', 1, 10, undefined);
    });
});
