import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerUpdateGatewayAclTool } from '../../src/tools/updateGatewayAcl.js';

describe('tools/updateGatewayAcl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

    const payload = {
        description: 'Guests allow WAN',
        status: true,
        policy: 1,
        protocols: [6],
        sourceIds: ['net-guests'],
        sourceType: 0,
        destinationType: 0,
        direction: { lanToWan: true },
        stateMode: 0,
        syslog: false,
    };

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
            }),
        } as unknown as McpServer;

        mockClient = {
            listOsgAcls: vi.fn().mockResolvedValue([{ id: 'acl-1', description: 'Old' }]),
            updateOsgAcl: vi.fn().mockResolvedValue({ ok: true }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary for an existing ACL', async () => {
        registerUpdateGatewayAclTool(mockServer, mockClient);

        const result = await toolHandler({ aclId: 'acl-1', payload, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.updateOsgAcl).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'update-gateway-acl',
                target: 'acl-1',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned gateway ACL update for acl-1.',
                result: {
                    accepted: true,
                    dryRun: true,
                    before: { id: 'acl-1', description: 'Old' },
                    plannedAcl: payload,
                },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('throws when the ACL does not exist', async () => {
        vi.mocked(mockClient.listOsgAcls).mockResolvedValue([] as never);
        registerUpdateGatewayAclTool(mockServer, mockClient);

        await expect(toolHandler({ dryRun: false, aclId: 'missing', payload }, { sessionId: 's1' })).rejects.toThrow(
            'No gateway ACL exists for missing.'
        );
    });

    it('updates the gateway ACL through the client', async () => {
        registerUpdateGatewayAclTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, aclId: 'acl-1', payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.updateOsgAcl).toHaveBeenCalledWith('acl-1', payload, 'site-1', undefined);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerUpdateGatewayAclTool(mockServer, mockClient);
        const result = (await toolHandler({ aclId: 'acl-1', payload }, { sessionId: 'preview' })) as {
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
