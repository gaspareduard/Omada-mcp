import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { toJsonSchemaCompat } from '@modelcontextprotocol/sdk/server/zod-json-schema-compat.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import packageMetadata from '../../package.json' with { type: 'json' };
import type { ToolCategory, ToolPermission } from '../config.js';
import { redactSecrets } from '../utils/redact.js';
import { type ToolExtra, toToolResult, wrapToolHandler } from './common.js';

export interface CatalogOptions {
    includeDeprecated?: boolean;
    allowToolHeaders?: boolean;
    catalogMode?: 'standard' | 'compact';
    capabilityProfile?: string;
}

export interface CatalogTool {
    name: string;
    description: string;
    inputSchema: z.ZodRawShape;
    annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
    category: ToolCategory;
    permission: ToolPermission;
    handler: (args: Record<string, unknown>, extra: ToolExtra) => Promise<CallToolResult>;
}

function sanitizeResult(result: CallToolResult): CallToolResult {
    return {
        ...result,
        ...(result.structuredContent ? { structuredContent: redactSecrets(result.structuredContent) as Record<string, unknown> } : {}),
        content: result.content.map((block) => {
            if (block.type !== 'text') return block;
            try {
                return { ...block, text: JSON.stringify(redactSecrets(JSON.parse(block.text)), null, 2) };
            } catch {
                return block;
            }
        }),
    };
}

export function registerCatalog(server: McpServer, tools: CatalogTool[], options: CatalogOptions = {}): void {
    const enabled = tools
        .filter((tool) => options.includeDeprecated || !tool.description.startsWith('[DEPRECATED]'))
        .map((tool) => ({
            ...tool,
            inputSchema: Object.fromEntries(
                Object.entries(tool.inputSchema)
                    .filter(([key]) => options.allowToolHeaders || key !== 'customHeaders')
                    .map(([key, schema]) => [
                        key,
                        key === 'customHeaders'
                            ? z
                                  .record(
                                      z.string().regex(/^(x-request-id|x-correlation-id)$/i, 'Only request/correlation ID headers are allowed'),
                                      z
                                          .string()
                                          .max(128)
                                          .regex(/^[\x20-\x7e]*$/, 'Header values must be printable ASCII')
                                  )
                                  .optional()
                            : schema,
                    ])
            ),
        }));
    const byName = new Map(enabled.map((tool) => [tool.name, tool]));
    const describe = (tool: CatalogTool): Record<string, unknown> => ({
        name: tool.name,
        description: tool.description,
        category: tool.category,
        permission: tool.permission,
        deprecated: tool.description.startsWith('[DEPRECATED]'),
        evidence: 'implemented; consult the release validation matrix for controller/device testing',
    });
    const invoke = async (tool: CatalogTool, args: Record<string, unknown>, extra: ToolExtra): Promise<CallToolResult> => {
        const validated = z.object(tool.inputSchema).strict().parse(args);
        return sanitizeResult(await tool.handler(validated, extra));
    };

    if (options.catalogMode !== 'compact') {
        for (const tool of enabled) {
            server.registerTool(
                tool.name,
                {
                    description: tool.description,
                    inputSchema: tool.inputSchema,
                    annotations: { ...tool.annotations, readOnlyHint: tool.permission === 'read', destructiveHint: tool.permission === 'write' },
                },
                (args, extra) => invoke(tool, args, extra)
            );
        }
    }

    server.registerTool(
        'searchOperations',
        {
            description: 'Search only enabled, implemented Omada tools. Results do not expand permissions. Inspect a result with describeOperation.',
            inputSchema: { query: z.string().max(200).default(''), limit: z.number().int().min(1).max(50).default(10) },
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        wrapToolHandler('searchOperations', ({ query, limit }) => {
            const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
            const matches = enabled.filter((tool) =>
                terms.every((term: string) => `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(term))
            );
            return Promise.resolve(
                toToolResult({ totalMatches: matches.length, limited: matches.length > limit, operations: matches.slice(0, limit).map(describe) })
            );
        })
    );
    server.registerTool(
        'describeOperation',
        {
            description: 'Get the exact argument schema and permission for an enabled tool. Unavailable tools cannot be inspected or executed.',
            inputSchema: { name: z.string().min(1) },
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        wrapToolHandler('describeOperation', ({ name }) => {
            const tool = byName.get(name);
            if (!tool) throw new Error(`Operation is unavailable: ${name}`);
            return Promise.resolve(
                toToolResult({
                    ...describe(tool),
                    inputSchema: toJsonSchemaCompat(z.object(tool.inputSchema).strict(), { strictUnions: true, pipeStrategy: 'input' }),
                })
            );
        })
    );
    server.registerTool(
        'getServerCapabilities',
        {
            description:
                'Report this server version, effective catalog, profile and validation limits. Does not claim live controller compatibility.',
            inputSchema: {},
            annotations: { readOnlyHint: true, destructiveHint: false },
        },
        wrapToolHandler('getServerCapabilities', async () =>
            toToolResult({
                version: packageMetadata.version,
                profile: options.capabilityProfile ?? 'custom',
                catalogMode: options.catalogMode ?? 'standard',
                enabledOperations: enabled.length,
                reads: enabled.filter((tool) => tool.permission === 'read').length,
                writes: enabled.filter((tool) => tool.permission === 'write').length,
                recoveryEnabled: enabled.some((tool) => tool.category === 'recovery'),
                deprecatedIncluded: options.includeDeprecated ?? false,
                toolHeadersEnabled: options.allowToolHeaders ?? false,
                mutationDefault: 'preview; explicitly set dryRun:false to apply',
                supportedTransport: 'stdio',
                api: 'official Open API',
                compatibility: 'Controller and device validation is operation-specific. Availability is not proof of firmware support.',
            })
        )
    );
    if (options.catalogMode === 'compact') {
        server.registerTool(
            'callOperation',
            {
                description:
                    'Invoke an enabled, implemented tool by its exact name and validated arguments. Inspect its schema first. No raw URLs or methods are accepted.',
                inputSchema: { name: z.string().min(1), arguments: z.record(z.string(), z.unknown()).default({}) },
                annotations: {
                    readOnlyHint: !enabled.some((tool) => tool.permission === 'write'),
                    destructiveHint: enabled.some((tool) => tool.permission === 'write'),
                },
            },
            wrapToolHandler('callOperation', ({ name, arguments: args }, extra) => {
                const tool = byName.get(name);
                if (!tool) throw new Error(`Operation is unavailable: ${name}`);
                return invoke(tool, args, extra);
            })
        );
    }
}
