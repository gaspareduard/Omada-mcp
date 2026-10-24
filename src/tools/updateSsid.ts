import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { type NetworkOperations, parseSsidBasicConfig } from '../omadaClient/network.js';
import { siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { applyWithVerification, compareRequestedFields } from '../utils/verification.js';

const changesSchema = z
    .object({
        name: z
            .string()
            .min(1)
            .refine((value) => Buffer.byteLength(value, 'utf8') <= 32, 'SSID name must be at most 32 UTF-8 bytes.')
            .optional(),
        broadcast: z.boolean().optional().describe('Advertise the SSID name. False hides the name; it does not disable the SSID.'),
        guestNetEnable: z.boolean().optional(),
        prohibitWifiShare: z.boolean().optional(),
    })
    .strict();

const inputSchema = siteInputSchema.extend({
    wlanId: z.string().trim().min(1),
    ssidId: z.string().trim().min(1),
    changes: changesSchema,
    dryRun: z.boolean().default(true),
});

// The parent integrates updateSsidBasicConfig into the client façade.
type SsidMutationClient = Pick<OmadaClient, 'getSsidDetail'> & Pick<NetworkOperations, 'updateSsidBasicConfig'>;

export function registerUpdateSsidTool(server: McpServer, client: SsidMutationClient): void {
    server.registerTool(
        'updateSsid',
        {
            description:
                'Update SSID name, broadcast visibility, guest network status, or Wi-Fi sharing policy within one WLAN group. Preserves required security settings and verifies requested fields. Changes can disconnect clients. The official basic-config API has no SSID enable/disable field. Defaults to a dry run.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler(
            'updateSsid',
            ({ ssidId, siteId }, result, mode) => ({
                action: 'update-ssid',
                target: ssidId,
                siteId,
                mode,
                status: mode === 'dry-run' ? 'planned' : 'submitted',
                summary: `SSID update ${mode === 'dry-run' ? 'planned' : 'processed'} for ${ssidId}.`,
                result,
            }),
            async (args) => {
                const { wlanId, ssidId, changes, siteId, customHeaders, dryRun } = inputSchema.parse(args);
                if (Object.keys(changes).length === 0) throw new Error('At least one SSID change is required.');
                const read = (): Promise<unknown> => client.getSsidDetail(wlanId, ssidId, siteId, customHeaders);
                const before = parseSsidBasicConfig(await read());
                const plannedConfig = parseSsidBasicConfig({ ...before, ...changes });
                // Return only supported public changes, never the security snapshot or credentials.
                const preview = { wlanId, ssidId, changes, disruption: 'SSID updates may disconnect wireless clients.' };
                if (dryRun) return { accepted: true, dryRun: true, ...preview };
                if (compareRequestedFields(changes, before).status !== 'verified') {
                    const fresh = parseSsidBasicConfig(await read());
                    if (compareRequestedFields(before, fresh).status !== 'verified' || compareRequestedFields(fresh, before).status !== 'verified')
                        throw new Error('SSID configuration changed during planning; read it again before applying.');
                }
                return {
                    ...preview,
                    ...(await applyWithVerification({
                        requested: changes,
                        before,
                        read,
                        write: async () => {
                            await client.updateSsidBasicConfig(wlanId, ssidId, plannedConfig, siteId, customHeaders);
                            return { accepted: true };
                        },
                    })),
                };
            }
        )
    );
}
