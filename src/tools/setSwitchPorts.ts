import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { type SwitchPortChange, type SwitchPortOperations, switchPortChangeSchema, switchPortListSchema } from '../omadaClient/switchPorts.js';
import { deviceMacSchema, siteInputSchema, wrapMutationToolHandler } from '../server/common.js';

type SwitchPortsClient = Pick<OmadaClient, 'getSwitchDetail'> & Pick<SwitchPortOperations, 'setSwitchPorts'>;

const inputSchema = siteInputSchema.extend({
    switchMac: deviceMacSchema.describe('Explicit switch MAC address.'),
    ports: switchPortListSchema.describe('Explicit, unique port IDs on this switch; 1 to 32 targets. No wildcards.'),
    change: switchPortChangeSchema.describe('One change for these ports. profile assigns a profile ID; profile-override only toggles override.'),
    dryRun: z.boolean().default(true).describe('Preview by default. Set false to apply the validated change and read back the result.'),
    allowDisruption: z.boolean().default(false).describe('Explicitly allow disruptive changes to known LAG ports. Unknown topology remains unknown.'),
});
type Input = z.infer<typeof inputSchema>;

// SwitchOverviewInfo.portList -> PortInfo. Missing/malformed evidence is not a default value.
const portSchema = z.object({
    port: z.number().int().min(1),
    name: z.string().optional().catch(undefined),
    status: z
        .union([z.literal(0), z.literal(1)])
        .optional()
        .catch(undefined),
    poeMode: z
        .union([z.literal(0), z.literal(1)])
        .optional()
        .catch(undefined),
    profileId: z.string().optional().catch(undefined),
    profileOverrideEnable: z.boolean().optional().catch(undefined),
    lagPort: z.boolean().optional().catch(undefined),
});
type Port = z.infer<typeof portSchema>;
type Field = 'name' | 'status' | 'poeMode' | 'profileId' | 'profileOverrideEnable';
type Verification = 'planned' | 'verified' | 'mismatch' | 'unknown';
interface Outcome {
    port: number;
    before: Port;
    after: Port | null;
    diff: { field: Field; before: string | number | boolean | null; requested: string | number | boolean };
    risk: { lag: boolean | 'unknown'; uplink: 'unknown'; trunk: 'unknown'; stack: 'unknown' };
    requestStatus: 'not-needed' | 'not-attempted' | 'submitted' | 'unknown';
    verification: Verification;
    requestError?: string;
    readbackIssue?: string;
}

function requestedChange(change: SwitchPortChange): [Field, string | number | boolean] {
    switch (change.operation) {
        case 'name':
            return ['name', change.name];
        case 'status':
            return ['status', change.status];
        case 'poe-mode':
            return ['poeMode', change.poeMode];
        case 'profile':
            return ['profileId', change.profileId];
        case 'profile-override':
            return ['profileOverrideEnable', change.profileOverrideEnable];
    }
}

function fieldValue(port: Port, field: Field): string | number | boolean | null {
    // The spec defines status only when lagPort is false.
    if (field === 'status' && port.lagPort !== false) return null;
    return port[field] ?? null;
}

function readPorts(value: unknown, switchMac: string): Map<number, Port> {
    const detail = z.object({ mac: z.string().optional(), portList: z.array(portSchema) }).safeParse(value);
    if (!detail.success) throw new Error('Switch detail does not expose the documented portList; port existence cannot be established.');
    const normalize = (mac: string): string => mac.replace(/[:-]/g, '').toLowerCase();
    if (detail.data.mac && normalize(detail.data.mac) !== normalize(switchMac)) {
        throw new Error('Switch detail MAC does not match the requested switch.');
    }
    const ports = new Map(detail.data.portList.map((port) => [port.port, port]));
    if (ports.size !== detail.data.portList.length) throw new Error('Switch detail contains ambiguous duplicate port IDs.');
    return ports;
}

async function run(client: SwitchPortsClient, args: Input): Promise<unknown> {
    const { switchMac, ports, change, siteId, customHeaders, dryRun, allowDisruption } = args;
    const before = readPorts(await client.getSwitchDetail(switchMac, siteId, customHeaders), switchMac);
    const [field, requested] = requestedChange(change);
    const outcomes: Outcome[] = ports.map((port) => {
        const state = before.get(port);
        if (!state) throw new Error(`Port ${port} does not exist in the switch detail; no mutations were sent.`);
        const current = fieldValue(state, field);
        return {
            port,
            before: state,
            after: null,
            diff: { field, before: current, requested },
            risk: { lag: state.lagPort ?? 'unknown', uplink: 'unknown', trunk: 'unknown', stack: 'unknown' },
            requestStatus: current === requested ? 'not-needed' : 'not-attempted',
            verification: dryRun ? 'planned' : 'unknown',
        };
    });
    const pending = outcomes.filter((outcome) => outcome.requestStatus !== 'not-needed');
    // Treat all non-name controls conservatively on a known LAG, including re-enabling a port.
    const disruptive = change.operation !== 'name';
    const blocked = disruptive && !allowDisruption ? pending.filter((outcome) => outcome.risk.lag === true).map((outcome) => outcome.port) : [];
    const prerequisiteBlockedPorts =
        change.operation === 'poe-mode'
            ? pending.filter((outcome) => outcome.before.profileOverrideEnable !== true).map((outcome) => outcome.port)
            : [];
    const warnings = [
        'SwitchOverviewInfo/PortInfo do not document uplink, trunk, or stack membership; these risks are unknown. Names are not topology evidence.',
        'Documented routes do not prove controller, firmware, or hardware support. PoE mode is configuration, not measured power delivery.',
    ];
    if (outcomes.some((outcome) => outcome.risk.lag === 'unknown')) warnings.push('LAG membership is unavailable for one or more ports.');
    if (outcomes.some((outcome) => outcome.diff.before === null))
        warnings.push('Current configuration is unavailable for one or more requested fields.');

    if (prerequisiteBlockedPorts.length)
        warnings.push('PoE changes require profileOverrideEnable:true on every changed port. Enable and verify the override separately first.');

    if (dryRun) {
        return {
            dryRun: true,
            outcomes,
            blockedPorts: blocked,
            prerequisiteBlockedPorts,
            canApply: blocked.length === 0 && prerequisiteBlockedPorts.length === 0,
            warnings,
            verification: { status: 'planned', attempts: 0 },
        };
    }
    if (blocked.length)
        throw new Error(`Disruptive change to LAG port(s) ${blocked.join(', ')} requires allowDisruption: true; no mutations were sent.`);

    if (prerequisiteBlockedPorts.length)
        throw new Error(`PoE changes require confirmed profile override on port(s) ${prerequisiteBlockedPorts.join(', ')}; no mutations were sent.`);

    // All targets were validated before the first PUT. Only profile assignment lacks a multi-port route.
    const groups = change.operation === 'profile' ? pending.map((outcome) => [outcome]) : pending.length ? [pending] : [];
    for (const group of groups) {
        try {
            await client.setSwitchPorts(
                switchMac,
                group.map((outcome) => outcome.port),
                change,
                siteId,
                customHeaders
            );
            for (const outcome of group) outcome.requestStatus = 'submitted';
        } catch {
            for (const outcome of group) {
                outcome.requestStatus = 'unknown';
                outcome.requestError = 'Write failed or was rejected; it may have applied. No retry or rollback was attempted.';
            }
            // Stop later profile writes after an uncertain outcome, but always attempt readback.
            break;
        }
    }

    let attempts = 0;
    for (; attempts < 3; ) {
        attempts += 1;
        try {
            const after = readPorts(await client.getSwitchDetail(switchMac, siteId, customHeaders), switchMac);
            for (const outcome of outcomes) {
                outcome.after = after.get(outcome.port) ?? null;
                const actual = outcome.after ? fieldValue(outcome.after, field) : null;
                outcome.verification = actual === null ? 'unknown' : actual === requested ? 'verified' : 'mismatch';
                outcome.readbackIssue = actual === null ? 'Port or requested field is absent or not semantically defined in readback.' : undefined;
            }
            if (outcomes.every((outcome) => outcome.verification === 'verified')) break;
        } catch {
            // Do not preserve a stale success after a later read fails.
            for (const outcome of outcomes) {
                outcome.after = null;
                outcome.verification = 'unknown';
                outcome.readbackIssue = 'Switch detail readback failed or returned an unsupported shape.';
            }
        }
    }
    const verified = outcomes.filter((outcome) => outcome.verification === 'verified').length;
    const status =
        verified === outcomes.length
            ? 'verified'
            : verified > 0
              ? 'partial'
              : outcomes.some((o) => o.verification === 'unknown')
                ? 'unknown'
                : 'mismatch';
    return {
        dryRun: false,
        outcomes,
        warnings,
        partialCompletion: verified > 0 && verified < outcomes.length,
        verification: { status, attempts, verified, total: outcomes.length },
        completion: verified === outcomes.length ? 'complete' : verified > 0 ? 'partial' : 'unconfirmed',
    };
}

export function registerSetSwitchPortsTool(server: McpServer, client: SwitchPortsClient): void {
    const handler = wrapMutationToolHandler<typeof inputSchema.shape>(
        'setSwitchPorts',
        ({ switchMac, siteId }, result, mode) => ({
            action: 'set-switch-ports',
            target: switchMac,
            siteId,
            mode,
            status: mode === 'dry-run' ? 'planned' : 'applied',
            summary:
                mode === 'dry-run'
                    ? `Previewed switch port change for ${switchMac}.`
                    : `Switch port workflow finished for ${switchMac}; inspect per-port verification.`,
            result,
        }),
        async (args) => await run(client, args)
    );
    server.registerTool(
        'setSwitchPorts',
        {
            description:
                'Preview or apply name, status, PoE mode, profile assignment, or profile override to 1–32 explicit switch ports, with preflight and bounded per-port verification.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true, readOnlyHint: false, idempotentHint: false },
        },
        // Parse here as well as in MCP so direct callers also receive safe defaults and validation.
        async (args, extra) => await handler(inputSchema.parse(args), extra)
    );
}
