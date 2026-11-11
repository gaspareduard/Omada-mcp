import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerListMdnsRulesTool } from '../../src/tools/listMdnsRules.js';

describe('tools/listMdnsRules', () => {
    it('returns every record from the complete read', async () => {
        let handler: (args: Record<string, unknown>, extra: object) => Promise<{ structuredContent?: unknown; content: { text: string }[] }> =
            async () => ({ content: [] });
        const server = { registerTool: vi.fn((_name, _def, fn) => (handler = fn)) } as unknown as McpServer;
        const client = { listMdnsRules: vi.fn().mockResolvedValue([{ id: 'r1' }]) };
        registerListMdnsRulesTool(server, client as unknown as OmadaClient);

        const result = await handler({ siteId: 'site-1' }, {});

        expect(server.registerTool).toHaveBeenCalledWith(
            'listMdnsRules',
            expect.objectContaining({ description: expect.any(String) }),
            expect.any(Function)
        );
        expect(client.listMdnsRules).toHaveBeenCalledWith('site-1', undefined);
        expect(JSON.parse(result.content[0].text)).toEqual([{ id: 'r1' }]);
    });
});
