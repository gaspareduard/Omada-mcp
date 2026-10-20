import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateSwitchAclTool } from '../../src/tools/updateSwitchAcl.js';

describe('tools/updateSwitchAcl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    const payload = {
        description: 'Block inter-VLAN updated',
        status: false,
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
            listOswAcls: vi.fn().mockResolvedValue([{ id: 'osw-acl-1', description: 'Block inter-VLAN' }]),
            updateOswAcl: vi.fn().mockResolvedValue({ ok: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary for an existing ACL', async () => {
        registerUpdateSwitchAclTool(mockServer, mockClient);

        const result = await toolHandler({ aclId: 'osw-acl-1', payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.updateOswAcl).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'update-switch-acl',
                            target: 'osw-acl-1',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned switch ACL update for osw-acl-1.',
                            result: {
                                accepted: true,
                                dryRun: true,
                                before: { id: 'osw-acl-1', description: 'Block inter-VLAN' },
                                plannedAcl: payload,
                            },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('throws when the ACL does not exist', async () => {
        vi.mocked(mockClient.listOswAcls).mockResolvedValue([] as never);
        registerUpdateSwitchAclTool(mockServer, mockClient);

        await expect(toolHandler({ aclId: 'missing', payload }, { sessionId: 's1' })).rejects.toThrow('No switch ACL exists for missing.');
    });

    it('updates the switch ACL through the client', async () => {
        registerUpdateSwitchAclTool(mockServer, mockClient);

        await toolHandler({ aclId: 'osw-acl-1', payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.updateOswAcl).toHaveBeenCalledWith('osw-acl-1', payload, 'site-1', undefined);
    });
});
