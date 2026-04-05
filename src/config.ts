import { z } from 'zod';

import { isLoopbackBindAddress, isValidBindAddress, isValidOrigin } from './utils/config-validations.js';

// ---------------------------------------------------------------------------
// Tool category types
// ---------------------------------------------------------------------------

export type ToolPermission = 'read' | 'write';
export type CapabilityProfile = 'safe-read' | 'ops-write' | 'admin' | 'compatibility';

/** All known atomic category names */
export const ALL_CATEGORIES = [
    // Dashboard & Insights
    'dashboard',
    'client-insights',
    'insights',
    // Clients
    'clients',
    // Devices
    'devices-general',
    'devices-ap',
    'devices-switch',
    'devices-gateway',
    // Wireless
    'wireless-ssid',
    'wireless-radio',
    'wireless-auth',
    // Network
    'network-wan',
    'network-sim-lte',
    'network-lan',
    'network-routing',
    'network-nat',
    'network-services',
    // Firewall & Security
    'firewall-acl',
    'firewall-traffic',
    'firewall-ids',
    'security-threat',
    'security-wids',
    // VPN
    'vpn',
    // Profiles & Schedules
    'profiles',
    'schedules',
    'auth-profiles',
    // Logs
    'logs',
    // Controller & Org
    'controller',
    'sites',
    'maintenance',
    'account-users',
    'account-sso',
    'account-cloud',
    // Hotspot
    'hotspot-portal',
    'hotspot-vouchers',
    'hotspot-users',
    // Niche
    'voip',
    'olt',
    'msp',
] as const;

export type ToolCategory = (typeof ALL_CATEGORIES)[number];

/** Categories declared in ALL_CATEGORIES but with no tool implementations yet (reserved for future phases). */
export const FUTURE_CATEGORIES = new Set<ToolCategory>([
    'insights',
    'network-sim-lte',
    'account-sso',
    'hotspot-portal',
    'hotspot-vouchers',
    'hotspot-users',
    'voip',
    'olt',
    'msp',
]);

/** Group aliases that expand to multiple categories */
export const CATEGORY_GROUP_ALIASES: Record<string, ToolCategory[]> = {
    all: [...ALL_CATEGORIES],
    'devices-all': ['devices-general', 'devices-ap', 'devices-switch', 'devices-gateway'],
    'wireless-all': ['wireless-ssid', 'wireless-radio', 'wireless-auth'],
    'network-all': ['network-wan', 'network-lan', 'network-routing', 'network-nat', 'network-services'],
    'firewall-all': ['firewall-acl', 'firewall-traffic', 'firewall-ids'],
    'security-all': ['security-threat', 'security-wids'],
};

export interface ActiveCategoryEntry {
    category: ToolCategory;
    permissions: Set<ToolPermission>;
}

export interface ParseToolCategoriesResult {
    categories: Map<ToolCategory, Set<ToolPermission>>;
    warnings: string[];
}

/**
 * Parse OMADA_TOOL_CATEGORIES string into a map of category → allowed permissions.
 *
 * Syntax: comma-separated tokens, each token is `<name>[:<suffix>]`
 *   - suffix `:r`  → read only
 *   - suffix `:w`  → write only
 *   - suffix `:rw` → read and write
 *   - no suffix    → read and write (`:rw`)
 *
 * Group aliases (e.g. `all`, `devices-all`) are expanded before the suffix is applied.
 * Unknown category names produce a warning and are skipped.
 * Future (unimplemented) categories produce a warning and are skipped.
 *
 * Returns a ParseToolCategoriesResult with categories map and buffered warnings.
 */
export function parseToolCategories(raw: string): ParseToolCategoriesResult {
    const categories = new Map<ToolCategory, Set<ToolPermission>>();
    const warnings: string[] = [];

    const tokens = raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

    for (const token of tokens) {
        // Split on the LAST colon to separate name from suffix
        const lastColon = token.lastIndexOf(':');
        let name: string;
        let suffix: string | undefined;

        if (lastColon !== -1) {
            const candidate = token.slice(lastColon + 1);
            if (candidate === 'r' || candidate === 'w' || candidate === 'rw') {
                name = token.slice(0, lastColon);
                suffix = candidate;
            } else {
                // Colon present but not a valid suffix — treat whole token as name
                name = token;
                suffix = undefined;
            }
        } else {
            name = token;
            suffix = undefined;
        }

        const permissions: Set<ToolPermission> = new Set();
        if (!suffix || suffix === 'rw') {
            permissions.add('read');
            permissions.add('write');
        } else if (suffix === 'r') {
            permissions.add('read');
        } else {
            permissions.add('write');
        }

        // Expand group aliases
        if (name in CATEGORY_GROUP_ALIASES) {
            for (const cat of CATEGORY_GROUP_ALIASES[name]) {
                if (FUTURE_CATEGORIES.has(cat)) {
                    warnings.push(
                        `OMADA_TOOL_CATEGORIES: category "${cat}" (from alias "${name}") is reserved for a future phase and has no tools yet — skipping`
                    );
                } else {
                    mergePermissions(categories, cat, permissions);
                }
            }
            continue;
        }

        // Validate atomic category name
        if (!(ALL_CATEGORIES as readonly string[]).includes(name)) {
            warnings.push(`OMADA_TOOL_CATEGORIES: unknown category "${name}" — skipping`);
            continue;
        }

        // Skip future/unimplemented categories
        if (FUTURE_CATEGORIES.has(name as ToolCategory)) {
            warnings.push(`OMADA_TOOL_CATEGORIES: category "${name}" is reserved for a future phase and has no tools yet — skipping`);
            continue;
        }

        mergePermissions(categories, name as ToolCategory, permissions);
    }

    return { categories, warnings };
}

function mergePermissions(map: Map<ToolCategory, Set<ToolPermission>>, cat: ToolCategory, perms: Set<ToolPermission>): void {
    const existing = map.get(cat);
    if (existing) {
        for (const p of perms) existing.add(p);
    } else {
        map.set(cat, new Set(perms));
    }
}

/** Default value for OMADA_TOOL_CATEGORIES */
export const DEFAULT_TOOL_CATEGORIES = 'dashboard:r,client-insights:r,clients:r,devices-all:r';

export const DEFAULT_CAPABILITY_PROFILE: CapabilityProfile = 'safe-read';

export const CAPABILITY_PROFILE_DEFAULTS: Record<CapabilityProfile, string> = {
    'safe-read': DEFAULT_TOOL_CATEGORIES,
    'ops-write': 'dashboard:r,client-insights:r,clients:rw,devices-all:r,maintenance:rw,logs:r,network-wan:r,security-threat:r,vpn:r',
    admin: 'all:rw',
    compatibility: 'all:rw',
};

const createBooleanStringSchema = (
    defaultValue: boolean
): z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodLiteral<'true'>, z.ZodLiteral<'false'>]>>, boolean, 'true' | 'false' | undefined> =>
    z
        .union([z.literal('true'), z.literal('false')])
        .optional()
        .transform((value: 'true' | 'false' | undefined) => {
            if (value === undefined) return defaultValue;
            return value === 'true';
        });

const numericStringSchema = z
    .string()
    .optional()
    .transform((value: string | undefined) => (value ? Number.parseInt(value, 10) : undefined))
    .pipe(z.number().positive().optional());

const listStringSchema = z
    .string()
    .optional()
    .transform((value: string | undefined) =>
        value
            ? value
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean)
            : undefined
    );

const envSchema = z
    .object({
        capabilityProfile: z.enum(['safe-read', 'ops-write', 'admin', 'compatibility']).optional().default(DEFAULT_CAPABILITY_PROFILE),
        // Tool category filtering
        toolCategories: z.string().optional(),

        // Omada Client Configuration
        baseUrl: z.string().url({ message: 'OMADA_BASE_URL must be a valid URL' }),
        clientId: z.string().min(1, 'OMADA_CLIENT_ID must not be empty').optional(),
        clientSecret: z.string().min(1, 'OMADA_CLIENT_SECRET must not be empty').optional(),
        omadacId: z.string().min(1, 'OMADA_OMADAC_ID must not be empty').optional(),
        siteId: z.string().min(1).optional(),
        strictSsl: createBooleanStringSchema(true),
        requestTimeout: numericStringSchema,

        // MCP Generic Server Configuration
        logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
        logFormat: z.enum(['plain', 'json', 'gcp-json']).optional().default('plain'),
        useHttp: createBooleanStringSchema(false),
        unsafeEnableHttp: createBooleanStringSchema(false),

        // MCP Server HTTP Configuration
        httpPort: numericStringSchema,
        httpBindAddr: z.string().optional(),
        httpPath: z.string().optional(),
        httpEnableHealthcheck: createBooleanStringSchema(true),
        httpHealthcheckPath: z.string().optional(),
        httpAllowCors: createBooleanStringSchema(true),
        httpAllowedOrigins: listStringSchema,
        httpNgrokEnabled: createBooleanStringSchema(false),
        httpNgrokAuthToken: z.string().optional(),
    })
    .refine((data) => !!data.clientId, { message: 'OMADA_CLIENT_ID is required', path: ['clientId'] })
    .refine((data) => !!data.clientSecret, {
        message: 'OMADA_CLIENT_SECRET is required',
        path: ['clientSecret'],
    })
    .refine((data) => !!data.omadacId, { message: 'OMADA_OMADAC_ID is required', path: ['omadacId'] })
    .refine((data) => !data.useHttp || data.unsafeEnableHttp, {
        message: 'MCP_SERVER_USE_HTTP requires MCP_UNSAFE_ENABLE_HTTP=true. HTTP transport is intentionally unsupported for the safe baseline.',
        path: ['unsafeEnableHttp'],
    })
    .refine((data) => !data.useHttp || !data.httpBindAddr || isLoopbackBindAddress(data.httpBindAddr), {
        message: 'HTTP transport is only allowed on loopback addresses (127.0.0.1 or ::1) in the safe baseline.',
        path: ['httpBindAddr'],
    })
    .refine(
        (data) => {
            // Validate httpBindAddr if provided
            if (data.httpBindAddr && !isValidBindAddress(data.httpBindAddr)) {
                return false;
            }
            return true;
        },
        {
            message: 'MCP_HTTP_BIND_ADDR must be a valid IPv4 or IPv6 address',
            path: ['httpBindAddr'],
        }
    )
    .refine(
        (data) => {
            // Validate httpAllowedOrigins if provided
            if (data.httpAllowedOrigins) {
                for (const origin of data.httpAllowedOrigins) {
                    if (!isValidOrigin(origin)) {
                        return false;
                    }
                }
            }
            return true;
        },
        (data) => {
            const invalidOrigin = data.httpAllowedOrigins?.find((origin) => !isValidOrigin(origin));
            return {
                message: `MCP_HTTP_ALLOWED_ORIGINS contains invalid origin: ${invalidOrigin}`,
                path: ['httpAllowedOrigins'],
            };
        }
    );

/**
 * The resolved Omada connection parameters required to build an OmadaClient.
 * All fields are guaranteed to be present.
 */
export interface OmadaConnectionConfig {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    omadacId: string;
    siteId?: string;
    strictSsl: boolean;
    requestTimeout?: number;
}

export interface EnvironmentConfig {
    capabilityProfile: CapabilityProfile;
    // Tool category filtering
    toolCategories: Map<ToolCategory, Set<ToolPermission>>;
    startupWarnings: string[];

    // Omada Client Configuration
    // baseUrl is always required (from env)
    // clientId, clientSecret, omadacId remain env-supplied even in legacy HTTP mode
    baseUrl: string;
    clientId?: string;
    clientSecret?: string;
    omadacId?: string;
    siteId?: string;
    strictSsl: boolean;
    requestTimeout?: number;

    // MCP Generic Server Configuration
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logFormat: 'plain' | 'json' | 'gcp-json';
    useHttp: boolean;
    unsafeEnableHttp: boolean;

    // MCP Server HTTP Configuration
    httpPort?: number;
    httpTransport: 'stream';
    httpBindAddr?: string;
    httpPath?: string;
    httpEnableHealthcheck: boolean;
    httpHealthcheckPath?: string;
    httpAllowCors: boolean;
    httpAllowedOrigins?: string[];
    httpNgrokEnabled: boolean;
    httpNgrokAuthToken?: string;
}

export function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
    const parsed = envSchema.safeParse({
        capabilityProfile: env.OMADA_CAPABILITY_PROFILE,
        // Tool category filtering
        toolCategories: env.OMADA_TOOL_CATEGORIES,

        // Omada Client Configuration
        baseUrl: env.OMADA_BASE_URL,
        clientId: env.OMADA_CLIENT_ID,
        clientSecret: env.OMADA_CLIENT_SECRET,
        omadacId: env.OMADA_OMADAC_ID,
        siteId: env.OMADA_SITE_ID,
        strictSsl: env.OMADA_STRICT_SSL,
        requestTimeout: env.OMADA_TIMEOUT,

        // MCP Generic Server Configuration
        logLevel: env.MCP_SERVER_LOG_LEVEL,
        logFormat: env.MCP_SERVER_LOG_FORMAT,
        useHttp: env.MCP_SERVER_USE_HTTP,
        unsafeEnableHttp: env.MCP_UNSAFE_ENABLE_HTTP,

        // MCP Server HTTP Configuration
        httpPort: env.MCP_HTTP_PORT,
        httpBindAddr: env.MCP_HTTP_BIND_ADDR,
        httpPath: env.MCP_HTTP_PATH,
        httpEnableHealthcheck: env.MCP_HTTP_ENABLE_HEALTHCHECK,
        httpHealthcheckPath: env.MCP_HTTP_HEALTHCHECK_PATH,
        httpAllowCors: env.MCP_HTTP_ALLOW_CORS,
        httpAllowedOrigins: env.MCP_HTTP_ALLOWED_ORIGINS,
        httpNgrokEnabled: env.MCP_HTTP_NGROK_ENABLED,
        httpNgrokAuthToken: env.MCP_HTTP_NGROK_AUTH_TOKEN,
    });

    if (!parsed.success) {
        const messages = parsed.error.issues.map((issue: z.ZodIssue) => issue.message);
        throw new Error(`Invalid environment configuration:\n${messages.join('\n')}`);
    }

    // Determine default httpPath
    const httpPath = parsed.data.httpPath ?? '/mcp';

    // Set default bind address and allowed origins for security
    const httpBindAddr = parsed.data.httpBindAddr ?? '127.0.0.1';
    let httpAllowedOrigins = parsed.data.httpAllowedOrigins ?? ['127.0.0.1', 'localhost'];

    const warnings: string[] = [];

    // If wildcard is present, use empty array to disable SDK origin validation
    // (we'll handle it in our error handler with better logging)
    if (httpAllowedOrigins.includes('*')) {
        warnings.push('Wildcard (*) origin allowed - origin validation is disabled. This should only be used in development.');
        httpAllowedOrigins = [];
    }

    const rawToolCategories = parsed.data.toolCategories ?? CAPABILITY_PROFILE_DEFAULTS[parsed.data.capabilityProfile];
    const { categories: toolCategories, warnings: categoryWarnings } = parseToolCategories(rawToolCategories);
    warnings.push(...categoryWarnings);
    if (!parsed.data.toolCategories) {
        warnings.push(`OMADA_CAPABILITY_PROFILE=${parsed.data.capabilityProfile} selected default tool categories: ${rawToolCategories}`);
    }
    if (parsed.data.capabilityProfile === 'compatibility') {
        warnings.push('Compatibility profile is reserved for future controller-specific fallback modules and should stay disabled in production.');
    }
    if (parsed.data.useHttp) {
        warnings.push('HTTP transport is enabled with explicit unsafe acknowledgement. The supported production baseline remains stdio only.');
    }

    return {
        capabilityProfile: parsed.data.capabilityProfile,
        // Tool category filtering
        toolCategories,
        startupWarnings: warnings,

        // Omada Client Configuration
        baseUrl: parsed.data.baseUrl.replace(/\/$/, ''),
        clientId: parsed.data.clientId,
        clientSecret: parsed.data.clientSecret,
        omadacId: parsed.data.omadacId,
        siteId: parsed.data.siteId,
        strictSsl: parsed.data.strictSsl,
        requestTimeout: parsed.data.requestTimeout,

        // MCP Generic Server Configuration
        logLevel: parsed.data.logLevel,
        logFormat: parsed.data.logFormat,
        useHttp: parsed.data.useHttp,
        unsafeEnableHttp: parsed.data.unsafeEnableHttp,

        // MCP Server HTTP Configuration
        httpPort: parsed.data.httpPort,
        httpTransport: 'stream' as const,
        httpBindAddr,
        httpPath,
        httpEnableHealthcheck: parsed.data.httpEnableHealthcheck,
        httpHealthcheckPath: parsed.data.httpHealthcheckPath,
        httpAllowCors: parsed.data.httpAllowCors,
        httpAllowedOrigins,
        httpNgrokEnabled: parsed.data.httpNgrokEnabled,
        httpNgrokAuthToken: parsed.data.httpNgrokAuthToken,
    };
}
