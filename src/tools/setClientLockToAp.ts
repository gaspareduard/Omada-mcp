import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, normalizeMac, requireByMac, runSettings } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    clientMac: deviceMacSchema.describe('Wireless client MAC address from listClients.'),
    enable: z.boolean().describe('true pins the client to the listed APs; false removes the pin.'),
    aps: z.array(deviceMacSchema).min(1).max(16).optional().describe('AP MAC addresses the client may associate with. Required when enable is true.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getClientDetail' | 'listDevices' | 'setClientLockToAp'>;

/** The API expects capitalised, hyphen-separated MACs (AA-BB-CC-DD-EE-FF). */
function apiMac(mac: string): string {
    return normalizeMac(mac).replace(/(..)(?!$)/g, '$1-');
}

/** Reads return aps as [{ name, mac }]; compare them as API-format MAC strings. */
function normalizeLockSetting(value: unknown): unknown {
    if (typeof value !== 'object' || value === null || !Array.isArray((value as { aps?: unknown }).aps)) return value;
    const aps = (value as { aps: unknown[] }).aps.map((ap) => {
        const mac = typeof ap === 'string' ? ap : typeof ap === 'object' && ap !== null ? (ap as { mac?: unknown }).mac : undefined;
        return typeof mac === 'string' ? apiMac(mac) : ap;
    });
    return { ...value, aps };
}

export function registerSetClientLockToApTool(server: McpServer, client: Client): void {
    server.registerTool(
        'setClientLockToAp',
        {
            description:
                'Pin a wireless client to specific APs (lock to AP) or remove the pin, e.g. to keep a static IoT device on its nearest AP. Locking to APs out of its range disconnects the client. Defaults to a preview; set dryRun:false to apply and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'setClientLockToAp',
            mutationSummary('set-client-lock-to-ap', (args) => String(args.clientMac)),
            async ({ clientMac, enable, aps, siteId, customHeaders, dryRun }) => {
                if (enable && !aps?.length) throw new Error('aps is required when enable is true.');
                const payload = enable ? { enable, aps: (aps ?? []).map(apiMac) } : { enable };
                if (payload.aps) {
                    const devices = await client.listDevices(siteId, customHeaders);
                    for (const ap of payload.aps) {
                        if (requireByMac(devices, ap, 'AP').type !== 'ap') throw new Error(`${ap} is not an AP. No request was sent.`);
                    }
                }
                const readDetail = async (): Promise<Record<string, unknown> | undefined> =>
                    (await client.getClientDetail(clientMac, siteId, customHeaders)) as Record<string, unknown> | undefined;
                const detail = await readDetail();
                if (!detail) throw new Error(`No client with MAC ${clientMac} exists in this site. No request was sent.`);
                if (detail.wireless !== true) throw new Error('Only wireless clients support lock to AP. No request was sent.');
                const warnings = ['A client locked to APs it cannot reach is disconnected.'];
                const currentAp = typeof detail.apMac === 'string' ? apiMac(detail.apMac) : undefined;
                if (payload.aps && currentAp && !payload.aps.includes(currentAp)) {
                    warnings.unshift(
                        `The client is currently associated with ${currentAp}, which is not in aps; it will be disconnected and must roam.`
                    );
                }
                return await runSettings({
                    label: 'client lock-to-AP',
                    read: async () => normalizeLockSetting((await readDetail())?.clientLockToApSetting),
                    payload,
                    dryRun,
                    write: () => client.setClientLockToAp(clientMac, payload, siteId, customHeaders),
                    warnings,
                });
            }
        )
    );
}
