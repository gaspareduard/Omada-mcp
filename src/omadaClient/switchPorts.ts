import { z } from 'zod';

import type { CustomHeaders, OmadaApiResponse } from '../types/index.js';
import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

// The API permits int32 port IDs; 32 targets is this workflow's explicit safety bound.
export const switchPortListSchema = z
    .array(z.number().int().min(1).max(2147483647))
    .min(1)
    .max(32)
    .refine((ports) => new Set(ports).size === ports.length, 'Port targets must be unique.');

// SwitchPortName's exact documented pattern, plus an explicit length bound.
const portNameSchema = z
    .string()
    .min(1)
    .max(128)
    .regex(/^[^ ?"]$|^[^ ?"][^?"]{0,126}[^ ?"]$/);
const binarySchema = z.union([z.literal(0), z.literal(1)]);

export const switchPortChangeSchema = z.discriminatedUnion('operation', [
    z.object({ operation: z.literal('name'), name: portNameSchema }).strict(),
    z.object({ operation: z.literal('status'), status: binarySchema }).strict(),
    z.object({ operation: z.literal('poe-mode'), poeMode: binarySchema }).strict(),
    z.object({ operation: z.literal('profile'), profileId: z.string().trim().min(1) }).strict(),
    z.object({ operation: z.literal('profile-override'), profileOverrideEnable: z.boolean() }).strict(),
]);

export type SwitchPortChange = z.infer<typeof switchPortChangeSchema>;

/** Official PUT routes in 03-device.json. Preflight and verification belong to the tool. */
export class SwitchPortOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string, version?: string) => string
    ) {}

    public async setSwitchPorts(
        switchMac: string,
        ports: number[],
        change: SwitchPortChange,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        if (!/^[0-9a-f]{2}([:-][0-9a-f]{2}){5}$/i.test(switchMac)) {
            throw new Error('A valid switch MAC address must be provided.');
        }
        const targets = switchPortListSchema.parse(ports);
        const { operation, ...payload } = switchPortChangeSchema.parse(change);
        const multiple = targets.length > 1;
        if (operation === 'profile' && multiple) {
            throw new Error('Profile assignment has only a single-port route; submit individual ports.');
        }
        const resolvedSiteId = await this.site.resolveSiteId(siteId);
        const suffix = multiple ? 'multi-ports' : `ports/${targets[0]}`;
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/switches/${encodeURIComponent(switchMac)}/${suffix}/${operation}`);
        const body = !multiple
            ? payload
            : operation === 'name'
              ? { portNameList: targets.map((port) => ({ port, ...payload })) }
              : { portList: targets, ...payload };

        // Even a failed response may follow an applied write. Disable transport retries too.
        const response = await this.request.request<OmadaApiResponse<unknown>>({ method: 'PUT', url: path, data: body }, false, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
