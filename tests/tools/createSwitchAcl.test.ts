import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerCreateSwitchAclTool } from '../../src/tools/createSwitchAcl.js';

describe('tools/createSwitchAcl', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<CallToolResult>;

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
                toolHandler = (args, extra) => handler(z.object(schema.inputSchema).parse(args), extra);
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
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'create-switch-acl',
                target: 'default-site',
                mode: 'dry-run',
                status: 'planned',
                summary: 'Planned switch ACL creation.',
                result: { accepted: true, dryRun: true, plannedAcl: payload },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('creates the switch ACL through the client', async () => {
        registerCreateSwitchAclTool(mockServer, mockClient);

        await toolHandler({ dryRun: false, payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.createOswAcl).toHaveBeenCalledWith(payload, 'site-1', undefined);
    });

    it('falls back to the raw create result when ACL cannot be found by description', async () => {
        vi.mocked(mockClient.createOswAcl).mockResolvedValueOnce({ raw: true });
        vi.mocked(mockClient.listOswAcls).mockResolvedValue([] as never);

        registerCreateSwitchAclTool(mockServer, mockClient);

        const result = await toolHandler({ dryRun: false, payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'create-switch-acl',
                target: 'site-1',
                siteId: 'site-1',
                mode: 'apply',
                status: 'submitted',
                summary: 'Switch ACL creation requested.',
                result: { raw: true },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });

    it('hydrates the created switch ACL when the create response does not include an id', async () => {
        vi.mocked(mockClient.createOswAcl).mockResolvedValueOnce({});
        vi.mocked(mockClient.listOswAcls)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 'osw-acl-1', description: payload.description }] as never);

        registerCreateSwitchAclTool(mockServer, mockClient);

        const result = await toolHandler({ dryRun: false, payload, siteId: 'site-1' }, { sessionId: 's1' });

        expect(result).toEqual({
            content: [{ type: 'text', text: expect.any(String) }],
            structuredContent: {
                action: 'create-switch-acl',
                target: 'site-1',
                siteId: 'site-1',
                mode: 'apply',
                status: 'submitted',
                summary: 'Switch ACL creation requested.',
                result: {
                    aclId: 'osw-acl-1',
                    createdAcl: { id: 'osw-acl-1', description: payload.description },
                },
            },
        });
        expect(JSON.parse(result.content[0].text as string)).toEqual(result.structuredContent);
    });
    it('defaults omitted dryRun to preview through the registered schema', async () => {
        registerCreateSwitchAclTool(mockServer, mockClient);
        const result = (await toolHandler({ payload }, { sessionId: 'preview' })) as {
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
