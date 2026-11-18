import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { OmadaClient } from '../omadaClient/index.js';
import { autoBackupOpenApiVO08Schema } from '../omadaClient/requestSchemas.js';
import { customHeadersSchema, wrapMutationToolHandler } from '../server/common.js';
import { dryRunSchema, mutationSummary, runSettings } from './resourceMutationShared.js';

const inputSchema = z.object({
    payload: autoBackupOpenApiVO08Schema.describe(
        'Automatic backup schedule (official AutoBackupOpenApiVO). Read getBackupSchedule first and send every field you want to keep.'
    ),
    dryRun: dryRunSchema,
    customHeaders: customHeadersSchema,
});

type Client = Pick<OmadaClient, 'getBackupSchedule' | 'setBackupSchedule'>;

export function registerSetBackupScheduleTool(server: McpServer, client: Client): void {
    server.registerTool(
        'setBackupSchedule',
        {
            description:
                'Change the controller automatic backup schedule (enable, timing, retention, file count, storage target). File-server credentials are write-only and are not verified by readback. Defaults to a preview of the current schedule and differences; set dryRun:false to apply once and verify by readback.',
            inputSchema: inputSchema.shape,
            annotations: { destructiveHint: true },
        },
        wrapMutationToolHandler<typeof inputSchema.shape>(
            'setBackupSchedule',
            mutationSummary('set-backup-schedule', () => 'controller'),
            async ({ payload, customHeaders, dryRun }) =>
                await runSettings({
                    label: 'backup schedule',
                    read: () => client.getBackupSchedule(customHeaders),
                    payload,
                    dryRun,
                    write: () => client.setBackupSchedule(payload, customHeaders),
                    writeOnly: ['fileServerConfig'],
                    warnings: [
                        'Lowering maxNumberOfFile or retention can make the controller delete older automatic backups.',
                        ...(payload.enable === false && Object.keys(payload).some((key) => key !== 'enable')
                            ? [
                                  'The controller ignores timing, retention and storage changes while the schedule is disabled (observed on 6.3). Apply them with enable:true first, then send {enable:false}.',
                              ]
                            : []),
                    ],
                })
        )
    );
}
