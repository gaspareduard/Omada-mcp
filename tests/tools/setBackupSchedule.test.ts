import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { OmadaApiError } from '../../src/omadaClient/request.js';
import { registerSetBackupScheduleTool } from '../../src/tools/setBackupSchedule.js';

type Handler = (
    args: Record<string, unknown>,
    extra: object
) => Promise<{ structuredContent?: Record<string, unknown>; content: { text: string }[] }>;

const before = { enable: false, occurrence: { timingType: 3, hour: 12, minute: 0, dayOfMonth: 1 }, maxNumberOfFile: 7, retention: 30 };
const payload = { enable: true, occurrence: { timingType: 1, hour: 3, minute: 0 }, maxNumberOfFile: 7, retention: 30 };

describe('tools/setBackupSchedule', () => {
    let state: Record<string, unknown>;
    let handler: Handler;
    let definition: { inputSchema: Record<string, { parse: (value: unknown) => unknown }> };
    let client: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
        state = before;
        client = {
            getBackupSchedule: vi.fn(async () => state),
            setBackupSchedule: vi.fn((body: Record<string, unknown>) => {
                const { fileServerConfig: _secret, ...readable } = body;
                state = readable;
                return Promise.resolve({});
            }),
        };
        const server = {
            registerTool: vi.fn((_name, def, fn) => {
                definition = def;
                handler = fn;
            }),
        } as unknown as McpServer;
        registerSetBackupScheduleTool(server, client as unknown as OmadaClient);
    });

    it('validates the documented payload', () => {
        expect(() => definition.inputSchema.payload.parse({ ...payload, unexpected: true })).toThrow();
        expect(() => definition.inputSchema.payload.parse({ maxNumberOfFile: 3 })).toThrow();
        expect(definition.inputSchema.payload.parse(payload)).toEqual(payload);
    });

    it('previews the difference without writing', async () => {
        const result = await handler({ payload }, {});
        expect(client.setBackupSchedule).not.toHaveBeenCalled();
        expect(result.structuredContent).toMatchObject({ status: 'planned', result: { before, alreadyMatches: false } });
    });

    it('applies once and verifies the readback', async () => {
        const result = await handler({ payload, dryRun: false }, {});
        expect(client.setBackupSchedule).toHaveBeenCalledTimes(1);
        expect(client.setBackupSchedule).toHaveBeenCalledWith(payload, undefined);
        expect(result.structuredContent).toMatchObject({ status: 'verified' });
    });

    it('reports file-server credentials as not verified', async () => {
        const withServer = {
            ...payload,
            storageType: 0,
            fileServerConfig: { protocol: 'SFTP', hostname: 'files.example.com', port: 22, password: 'x' },
        };
        const result = await handler({ payload: withServer, dryRun: false }, {});
        expect(result.structuredContent).toMatchObject({ result: { notVerifiedFields: ['fileServerConfig'] } });
    });

    it('warns that a disabled schedule ignores other fields', async () => {
        const disabled = await handler({ payload: { ...payload, enable: false } }, {});
        expect(JSON.stringify(disabled.structuredContent)).toContain('ignores timing');
        const onlyDisable = await handler({ payload: { enable: false } }, {});
        expect(JSON.stringify(onlyDisable.structuredContent)).not.toContain('ignores timing');
    });

    it('surfaces controller rejections', async () => {
        client.setBackupSchedule.mockRejectedValueOnce(new OmadaApiError(-30028, 'busy'));
        await expect(handler({ payload, dryRun: false }, {})).rejects.toThrow('(errorCode -30028): busy');
    });
});
