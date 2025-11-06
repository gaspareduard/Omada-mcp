import type { ActiveClientInfo, ClientActivity, GetClientActivityOptions, OmadaApiResponse, OmadaClientInfo } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

/**
 * Client-related operations for the Omada API.
 */
export class ClientOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string) => string
    ) {}

    /**
     * List all clients in a site.
     */
    public async listClients(siteId?: string): Promise<OmadaClientInfo[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        return this.request.fetchPaginated<OmadaClientInfo>(this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients`));
    }

    /**
     * Get a specific client by MAC address or client ID.
     */
    public async getClient(identifier: string, siteId?: string): Promise<OmadaClientInfo | undefined> {
        const clients = await this.listClients(siteId);
        return clients.find((client) => client.mac === identifier || client.id === identifier);
    }

    /**
     * Get most active clients in a site (dashboard endpoint).
     * Returns clients sorted by total traffic.
     *
     * @param siteId - Optional site ID, uses default from config if not provided
     * @returns Array of active client information
     */
    public async listMostActiveClients(siteId?: string): Promise<ActiveClientInfo[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const response = await this.request.get<OmadaApiResponse<ActiveClientInfo[]>>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/active-clients`)
        );
        return response.result ?? [];
    }

    /**
     * Get client activity statistics over time (dashboard endpoint).
     * Returns time-series data about new, active, and disconnected clients.
     *
     * @param options - Options including optional siteId, start, and end timestamps
     * @returns Array of client activity snapshots over time
     */
    public async listClientsActivity(options: GetClientActivityOptions = {}): Promise<ClientActivity[]> {
        const resolvedSiteId = this.site.resolveSiteId(options.siteId);
        const params: Record<string, unknown> = {};

        if (options.start !== undefined) {
            params.start = options.start;
        }
        if (options.end !== undefined) {
            params.end = options.end;
        }

        const response = await this.request.get<OmadaApiResponse<ClientActivity[]>>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/client-activity`),
            params
        );
        return response.result ?? [];
    }
}
