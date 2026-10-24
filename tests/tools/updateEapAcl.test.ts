import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateEapAclTool } from '../../src/tools/updateEapAcl.js';

describe('tools/updateEapAcl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

    const payload = {
        description: 'Guests wireless update',
        status: true,
        policy: 1,
        protocols: [6],
        sourceIds: ['ssid-guests'],
        sourceType: 4,
        destinationType: 0,
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
            }),
        } as unknown as McpServer;

        mockClient = {
            listEapAcls: vi.fn().mockResolvedValue([{ id: 'acl-2', description: 'Old wireless' }]),
            getLanNetworkList: vi.fn().mockResolvedValue([{ id: 'net-1' }]),
            getWlanGroupList: vi.fn().mockResolvedValue([{ wlanId: 'wlan-1' }]),
            getSsidList: vi.fn().mockResolvedValue([{ id: 'ssid-guests' }]),
            updateEapAcl: vi.fn().mockResolvedValue({ ok: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary for an existing ACL', async () => {
        registerUpdateEapAclTool(mockServer, mockClient);

        const result = await toolHandler({ aclId: 'acl-2', payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.updateEapAcl).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'update-eap-acl',
                target: 'acl-2',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned EAP ACL update for acl-2.',
                result: {
                    accepted: true,
                    dryRun: true,
                    before: { id: 'acl-2', description: 'Old wireless' },
                    plannedAcl: payload,
                },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('updates the EAP ACL through the client', async () => {
        registerUpdateEapAclTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, aclId: 'acl-2', payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.updateEapAcl).toHaveBeenCalledWith('acl-2', payload, 'site-1', undefined);
    });

    it('throws when the target ACL does not exist', async () => {
        vi.mocked(mockClient.listEapAcls).mockResolvedValue([] as never);
        registerUpdateEapAclTool(mockServer, mockClient);

        await expect(toolHandler({ dryRun: false, aclId: 'missing', payload }, { sessionId: 's1' })).rejects.toThrow(
            'No EAP ACL exists for missing.'
        );
    });

    it('rejects unknown source references before mutating', async () => {
        registerUpdateEapAclTool(mockServer, mockClient);
        vi.mocked(mockClient.getSsidList).mockResolvedValue([{ id: 'other-ssid' }] as never);

        await expect(toolHandler({ dryRun: false, aclId: 'acl-2', payload, siteId: 'site-1' }, { sessionId: 's1' })).rejects.toThrow(
            'Unknown SSID ids in sourceIds: ssid-guests.'
        );
        expect(mockClient.updateEapAcl).not.toHaveBeenCalled();
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerUpdateEapAclTool(mockServer, mockClient);
        const result = (await toolHandler({ aclId: 'acl-2', payload }, { sessionId: 'preview' })) as {
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
