import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { switchPortListSchema } from '../omadaClient/switchPorts.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runAction, toRecords } from './resourceMutationShared.js';

const inputSchema = siteInputSchema.extend({
    switchMac: deviceMacSchema.describe('MAC address of the switch.'),
    ports: switchPortListSchema.describe('Explicit, unique port IDs to power-cycle; 1 to 32 targets.'),
    dryRun: dryRunSchema,
});

type Client = Pick<OmadaClient, 'getSwitchDetail' | 'recoverSwitchPortPoe'>;

export function registerRecoverSwitchPortPoeTool(server: McpServer, client: Client): void {
    server.registerTool(
        'recoverSwitchPortPoe',
        {
            description:
                'Power-cycle PoE on switch ports (PoE recovery) to reboot powered devices such as cameras or APs. Connected devices lose power and connectivity until they boot. Defaults to a preview; set dryRun:false to send.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'recoverSwitchPortPoe',
            mutationSummary('recover-switch-port-poe', (args) => `${String(args.switchMac)} ports ${String(args.ports)}`),
            async ({ switchMac, ports, siteId, customHeaders, dryRun }) =>
                await runAction({
                    label: 'PoE recovery',
                    dryRun,
                    preflight: async () => {
                        const detail = (await client.getSwitchDetail(switchMac, siteId, customHeaders)) as { portList?: unknown };
                        const known = new Map(toRecords(detail?.portList ?? []).map((port) => [port.port, port]));
                        const missing = ports.filter((port) => !known.has(port));
                        if (missing.length) throw new Error(`Ports ${missing.join(', ')} do not exist on this switch. No request was sent.`);
                        return { switchMac, ports: ports.map((port) => ({ port, name: known.get(port)?.name })) };
                    },
                    write: () => client.recoverSwitchPortPoe(switchMac, { ports }, siteId, customHeaders),
                    warnings: ['Powered devices on these ports lose power and connectivity until they boot again.'],
                })
        )
    );
}
