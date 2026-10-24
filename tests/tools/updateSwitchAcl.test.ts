import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateSwitchAclTool } from '../../src/tools/updateSwitchAcl.js';

describe('tools/updateSwitchAcl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

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
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
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
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
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
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('throws when the ACL does not exist', async () => {
        vi.mocked(mockClient.listOswAcls).mockResolvedValue([] as never);
        registerUpdateSwitchAclTool(mockServer, mockClient);

        await expect(toolHandler({ dryRun: false, aclId: 'missing', payload }, { sessionId: 's1' })).rejects.toThrow(
            'No switch ACL exists for missing.'
        );
    });

    it('updates the switch ACL through the client', async () => {
        registerUpdateSwitchAclTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, aclId: 'osw-acl-1', payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.updateOswAcl).toHaveBeenCalledWith('osw-acl-1', payload, 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerUpdateSwitchAclTool(mockServer, mockClient);
        const result = (await toolHandler({ aclId: 'osw-acl-1', payload }, { sessionId: 'preview' })) as {
            content: { text: string }[];
            structuredContent: Record<string, unknown>;
        };
        const summary = JSON.parse(result.content[0].text);
        expect(summary).toMatchObject({ mode: 'dry-run', status: 'planned' });
        expect(result.structuredContent).toEqual(expect.objectContaining(summary));
        for (const [name, operation] of Object.entries(mockClient)) {
            if (!/^(get|list|resolve)/.test(name)) expect(operation).not.toHaveBeenCalled();
        }
    });
});
