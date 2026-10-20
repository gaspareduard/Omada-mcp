import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerCreateSwitchAclTool } from '../../src/tools/createSwitchAcl.js';

describe('tools/createSwitchAcl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const payload = {
        description: 'Block inter-VLAN',
        status: true,
        policy: 0,
        protocols: [0],
        sourceIds: ['port-1'],
        sourceType: 1,
        destinationType: 1,
        bindingType: 0,
        etherType: { enable: false },
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            listOswAcls: vi.fn().mockResolvedValue([]),
            createOswAcl: vi.fn().mockResolvedValue({ id: 'osw-acl-1' }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run preview', async () => {
        registerCreateSwitchAclTool(mockServer, mockClient);

        const result = await toolHandler({ payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.createOswAcl).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'create-switch-acl',
                            target: 'default-site',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned switch ACL creation.',
                            result: { accepted: true, dryRun: true, plannedAcl: payload },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('creates the switch ACL through the client', async () => {
        registerCreateSwitchAclTool(mockServer, mockClient);

        await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.createOswAcl).toHaveBeenCalledWith(payload, 'site-1', undefined);
    });

    it('falls back to the raw create result when ACL cannot be found by description', async () => {
        vi.mocked(mockClient.createOswAcl).mockResolvedValueOnce({ raw: true });
        vi.mocked(mockClient.listOswAcls).mockResolvedValue([] as never);

        registerCreateSwitchAclTool(mockServer, mockClient);

        const result = await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'create-switch-acl',
                            target: 'site-1',
                            siteId: 'site-1',
                            mode: 'apply',
                            status: 'applied',
                            summary: 'Switch ACL creation requested.',
                            result: { raw: true },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('hydrates the created switch ACL when the create response does not include an id', async () => {
        vi.mocked(mockClient.createOswAcl).mockResolvedValueOnce({});
        vi.mocked(mockClient.listOswAcls)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 'osw-acl-1', description: payload.description }] as never);

        registerCreateSwitchAclTool(mockServer, mockClient);

        const result = await toolHandler({ payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'create-switch-acl',
                            target: 'site-1',
                            siteId: 'site-1',
                            mode: 'apply',
                            status: 'applied',
                            summary: 'Switch ACL creation requested.',
                            result: {
                                aclId: 'osw-acl-1',
                                createdAcl: { id: 'osw-acl-1', description: payload.description },
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });
});
