import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { OmadaClient } from '../../src/omadaClient/index.js';
import { parseAvailableChannels, projectRadioConfig, registerSetApRadioTool } from '../../src/tools/setApRadio.js';

describe('tools/setApRadio', () => {
    let handler: (args: unknown, extra: object) => Promise<{ content: { text: string }[] }>;
    let state: Record<string, unknown>;
    let client: {
        getRadiosConfig: ReturnType<typeof vi.fn>;
        getSitesApsAvailableChannel: ReturnType<typeof vi.fn>;
        setRadiosConfig: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        state = {
            radioSetting2g: { radioEnable: true, channel: '1', freq: 2412, channelWidth: '2', txPowerLevel: 2, readOnlyTelemetry: 99 },
            radioSetting5g: { radioEnable: true, channel: '1', freq: 5180, channelWidth: '5', txPowerLevel: 2 },
            radioSetting6g: null,
            readOnlyTopLevel: 'excluded',
        };
        client = {
            getRadiosConfig: vi.fn(() => Promise.resolve(state)),
            getSitesApsAvailableChannel: vi.fn().mockResolvedValue([
                {
                    radioId: 0,
                    apChannelDetailList: [
                        { channel: 1, index: 1, freq: 2412, availableChannelWidthList: [20, 40] },
                        { channel: 6, index: 6, freq: 2437, availableChannelWidthList: [20, 40] },
                    ],
                },
                { radioId: 1, apChannelDetailList: [{ channel: 36, index: 1, freq: 5180, availableChannelWidthList: [20, 40, 80] }] },
            ]),
            setRadiosConfig: vi.fn((_mac, payload) => {
                state = payload;
                return Promise.resolve({ accepted: true });
            }),
        };
        const server = {
            registerTool: vi.fn((_name, _schema, callback) => {
                handler = callback;
            }),
        } as unknown as McpServer;
        registerSetApRadioTool(server, client as unknown as OmadaClient);
        expect(server.registerTool).toHaveBeenCalledWith(
            'setApRadio',
            expect.objectContaining({ annotations: { destructiveHint: true } }),
            expect.any(Function)
        );
    });

    async function call(changes: Record<string, unknown>): Promise<Record<string, unknown>> {
        return JSON.parse((await handler({ apMac: 'AA:BB:CC:DD:EE:FF', band: '2.4GHz', siteId: 'site-1', ...changes }, {})).content[0].text).result;
    }

    it('defaults to a dry-run, projecting writable fields and preserving sibling bands', async () => {
        const result = await call({ channel: 6, channelWidthMHz: 40 });
        expect(result).toMatchObject({
            dryRun: true,
            plannedConfig: {
                radioSetting2g: { channel: '6', freq: 2437, channelWidth: '3', radioEnable: true, txPowerLevel: 2 },
                radioSetting5g: state.radioSetting5g,
            },
        });
        expect(JSON.stringify(result)).not.toContain('readOnly');
        expect(client.setRadiosConfig).not.toHaveBeenCalled();
    });

    it('maps a human channel number to its index and frequency, then verifies one write', async () => {
        state.radioSetting5g = { radioEnable: true, channel: '2', freq: 5200, channelWidth: '5' };
        const result = await call({
            band: '5GHz',
            channel: 36,
            channelWidthMHz: 80,
            txPowerLevel: 1,
            dryRun: false,
            customHeaders: { 'X-Test': 'header' },
        });
        expect(client.setRadiosConfig).toHaveBeenCalledExactlyOnceWith(
            'AA:BB:CC:DD:EE:FF',
            expect.objectContaining({ radioSetting5g: { radioEnable: true, channel: '1', freq: 5180, channelWidth: '5', txPowerLevel: 1 } }),
            'site-1',
            { 'X-Test': 'header' }
        );
        expect(result).toMatchObject({ noOp: false, verification: { status: 'verified', attempts: 1 } });
    });

    it('disables a radio and performs no write for a subsequent no-op', async () => {
        expect(await call({ radioEnable: false, dryRun: false })).toMatchObject({ verification: { status: 'verified' } });
        expect(await call({ radioEnable: false, dryRun: false })).toMatchObject({ noOp: true, verification: { status: 'verified', attempts: 0 } });
        expect(client.setRadiosConfig).toHaveBeenCalledTimes(1);
    });

    it('accepts a width-only change when the current channel advertises it', async () => {
        expect(await call({ channelWidthMHz: 40 })).toMatchObject({ plannedConfig: { radioSetting2g: { channelWidth: '3' } } });
    });

    it('validates retained fixed width when moving channels', async () => {
        expect(await call({ channel: 6 })).toMatchObject({ plannedConfig: { radioSetting2g: { channel: '6', channelWidth: '2' } } });
        state.radioSetting2g = { channel: '1', channelWidth: '7' };
        await expect(call({ channel: 6 })).rejects.toThrow('combination');
    });

    it.each([
        [{}, 'At least one'],
        [{ band: '6GHz', radioEnable: true }, 'supported'],
        [{ channel: 100 }, 'mapping'],
        [{ channel: 6, channelWidthMHz: 80 }, 'combination'],
        [{ txPowerLevel: 3 }, 'Invalid input'],
        [{ channel: 0 }, 'greater than 0'],
    ])('rejects unsupported or empty controls %j', async (changes, error) => {
        await expect(call(changes)).rejects.toThrow(error);
        expect(client.setRadiosConfig).not.toHaveBeenCalled();
    });

    it('rejects a width-only change when the current channel is automatic', async () => {
        state.radioSetting2g = { channel: '0', channelWidth: '4' };
        await expect(call({ channelWidthMHz: 40 })).rejects.toThrow('combination');
    });

    it('allows a fixed channel while retaining the documented automatic width code', async () => {
        state.radioSetting2g = { channel: '0', channelWidth: '4' };
        expect(await call({ channel: 6 })).toMatchObject({ plannedConfig: { radioSetting2g: { channel: '6', channelWidth: '4' } } });
    });

    it('rejects missing radio capabilities and missing channel index/frequency', async () => {
        client.getSitesApsAvailableChannel.mockResolvedValue([]);
        await expect(call({ txPowerLevel: 1 })).rejects.toThrow('No channel capabilities');
        client.getSitesApsAvailableChannel.mockResolvedValue({ radioId: 0, apChannelDetailList: [] });
        await expect(call({ radioEnable: false })).rejects.toThrow('No channel capabilities');
        client.getSitesApsAvailableChannel.mockResolvedValue({ radioId: 0, apChannelDetailList: [{ channel: 6 }] });
        await expect(call({ channel: 6 })).rejects.toThrow('mapping');
    });

    it('rejects a stale snapshot without writing', async () => {
        client.getRadiosConfig.mockResolvedValueOnce(state).mockResolvedValue({ ...state, radioSetting5g: { radioEnable: false } });
        await expect(call({ radioEnable: false, dryRun: false })).rejects.toThrow('changed during planning');
        expect(client.setRadiosConfig).not.toHaveBeenCalled();
    });

    it('reports partial application and sibling changes as mismatches', async () => {
        client.setRadiosConfig.mockImplementation((_mac, payload) => {
            state = { ...payload, radioSetting5g: { radioEnable: false } };
            return Promise.resolve({ accepted: true });
        });
        expect(await call({ radioEnable: false, dryRun: false })).toMatchObject({ verification: { status: 'mismatch', attempts: 3 } });
        expect(client.setRadiosConfig).toHaveBeenCalledTimes(1);
    });

    it('detects newly added writable fields during planning', async () => {
        client.getRadiosConfig.mockResolvedValueOnce(state).mockResolvedValue({ ...state, radioSetting6g: { radioEnable: true } });
        await expect(call({ radioEnable: false, dryRun: false })).rejects.toThrow('changed during planning');
        expect(client.setRadiosConfig).not.toHaveBeenCalled();
    });

    it('rejects malformed controller responses without guessing response wrappers', () => {
        expect(() => parseAvailableChannels({ data: [] })).toThrow();
        expect(() => projectRadioConfig(null)).toThrow();
        expect(() => projectRadioConfig({ radioSetting2g: { radioEnable: 'true' } })).toThrow();
        expect(projectRadioConfig({ unsupported: {}, radioSetting2g: null })).toEqual({});
    });
});
