import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { registerSetAclConfigTypeSettingTool } from '../../src/tools/setAclConfigTypeSetting.js';

describe('tools/setAclConfigTypeSetting', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;
    let toolHandler: (args: unknown, extra: { sessionId?: string }) => Promise<unknown>;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn((name, schema, handler) => {
                toolHandler = handler;
            }),
        } as unknown as McpServer;

        mockClient = {
            getAclConfigTypeSetting: vi.fn().mockResolvedValue({ mode: 1 }),
            setAclConfigTypeSetting: vi.fn().mockResolvedValue({ mode: 0 }),
        } as unknown as OmadaClient;
    });

    it('returns a dry-run summary', async () => {
        registerSetAclConfigTypeSettingTool(mockServer, mockClient);

        const result = await toolHandler({ mode: 0, dryRun: true }, { sessionId: 's1' });

        expect(mockClient.setAclConfigTypeSetting).not.toHaveBeenCalled();
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(
                        {
                            action: 'set-acl-config-type-setting',
                            target: 'default-site',
                            mode: 'dry-run',
                            status: 'planned',
                            summary: 'Planned ACL config mode update.',
                            result: { accepted: true, dryRun: true, before: { mode: 1 }, plannedConfig: { mode: 0 } },
                        },
                        null,
                        2
                    ),
                },
            ],
        });
    });

    it('updates the config type mode through the client', async () => {
        registerSetAclConfigTypeSettingTool(mockServer, mockClient);

        await toolHandler({ mode: 0, siteId: 'site-1' }, { sessionId: 's1' });

        expect(mockClient.setAclConfigTypeSetting).toHaveBeenCalledWith({ mode: 0 }, 'site-1', undefined);
    });
});
