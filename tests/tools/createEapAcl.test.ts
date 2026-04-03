import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerCreateEapAclTool } from '../../src/tools/createEapAcl.js';

describe('tools/createEapAcl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const payload = {
        description: 'Guests wireless',
        status: true,
        policy: 0,
        protocols: [6],
        sourceIds: ['ssid-guests'],
        sourceType: 4,
        destinationType: 0,
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getLanNetworkList: vi.fn().mockResolvedValue([{ id: 'net-1' }]),
            getWlanGroupList: vi.fn().mockResolvedValue([{ wlanId: 'wlan-1' }]),
            getSsidList: vi.fn().mockResolvedValue([{ id: 'ssid-guests' }]),
            listEapAcls: vi.fn().mockResolvedValue([]),
            createEapAcl: vi.fn().mockResolvedValue({ id: 'acl-2' }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview', async () => {
        registerCreateEapAclTool(mockServer, mockClient);

        const result = await toolHandler({ payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.createEapAcl).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'create-eap-acl',
                            target: 'default-site',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned EAP ACL creation.',
                            result: { accepted: true, dryRun: true, plannedAcl: payload },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('creates the EAP ACL through the client', async () => {
        registerCreateEapAclTool(mockServer, mockClient);

        await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.createEapAcl).toHaveBeenCalledWith(payload, 'site-1', undefined);
    });

    it('hydrates the created EAP ACL when the create response does not include an id', async () => {
        vi.mocked(mockClient.createEapAcl).mockResolvedValueOnce({});
        vi.mocked(mockClient.listEapAcls)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 'acl-2', description: payload.description }] as never);

        registerCreateEapAclTool(mockServer, mockClient);

        const result = await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'create-eap-acl',
                            target: 'site-1',
                            siteId: 'site-1',
                            mode: 'apply',
                            status: 'applied',
                            summary: 'EAP ACL creation requested.',
                            result: {
                                aclId: 'acl-2',
                                createdAcl: { id: 'acl-2', description: payload.description },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('rejects unknown SSID ids before mutating', async () => {
        registerCreateEapAclTool(mockServer, mockClient);
        vi.mocked(mockClient.getSsidList).mockResolvedValue([{ id: 'ssid-1' }] as never);

        await expect(toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' })).rejects.toThrow('Unknown SSID ids in sourceIds: ssid-guests.');

        expect(mockClient.createEapAcl).not.toHaveBeenCalled();
    });
});
