import type {
    ActiveClientInfo,
    ClientActivity,
    ClientPastConnection,
    ClientRateLimitSetting,
    CustomHeaders,
    GetClientActivityOptions,
    ListClientsPastConnectionsOptions,
    OmadaApiResponse,
    OmadaClientInfo,
    PaginatedResult,
    RateLimitProfile,
    UpdateClientRateLimitRequest,
} from '../types/index.js';

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
    public async listClients(siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaClientInfo[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        return await this.request.fetchPaginated<OmadaClientInfo>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients`),
            {},
            customHeaders
        );
    }

    /**
     * Get a specific client by MAC address or client ID.
     */
    public async getClient(identifier: string, siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaClientInfo | undefined> {
        const clients = await this.listClients(siteId, customHeaders);
        return clients.find((client) => client.mac === identifier || client.id === identifier);
    }

    /**
     * Get most active clients in a site (dashboard endpoint).
     * Returns clients sorted by total traffic.
     *
     * @param siteId - Optional site ID, uses default from config if not provided
     * @returns Array of active client information
     */
    public async listMostActiveClients(siteId?: string, customHeaders?: CustomHeaders): Promise<ActiveClientInfo[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const response = await this.request.get<OmadaApiResponse<ActiveClientInfo[]>>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/active-clients`),
            undefined,
            customHeaders
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
    public async listClientsActivity(options: GetClientActivityOptions = {}, customHeaders?: CustomHeaders): Promise<ClientActivity[]> {
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
            params,
            customHeaders
        );
        return response.result ?? [];
    }

    /**
     * Get client past connection list (insight endpoint).
     * Returns historical client connection data with support for pagination, filtering, and sorting.
     *
     * @param options - Options including siteId, pagination, filters, and search parameters
     * @returns Array of client past connection information
     */
    public async listClientsPastConnections(
        options: ListClientsPastConnectionsOptions,
        customHeaders?: CustomHeaders
    ): Promise<ClientPastConnection[]> {
        const resolvedSiteId = this.site.resolveSiteId(options.siteId);
        const params: Record<string, unknown> = {
            page: options.page,
            pageSize: options.pageSize,
        };

        // Add optional sort parameter
        if (options.sortLastSeen !== undefined) {
            params['sorts.lastSeen'] = options.sortLastSeen;
        }

        // Add optional filter parameters
        if (options.timeStart !== undefined) {
            params['filters.timeStart'] = String(options.timeStart);
        }
        if (options.timeEnd !== undefined) {
            params['filters.timeEnd'] = String(options.timeEnd);
        }
        if (options.guest !== undefined) {
            params['filters.guest'] = String(options.guest);
        }

        // Add optional search parameter
        if (options.searchKey !== undefined) {
            params.searchKey = options.searchKey;
        }

        const response = await this.request.get<OmadaApiResponse<PaginatedResult<ClientPastConnection>>>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/insight/past-connection`),
            params,
            customHeaders
        );

        const result = this.request.ensureSuccess(response);
        return result.data ?? [];
    }

    /**
     * Get rate limit profile list for a site.
     * Returns available rate limit profiles that can be applied to clients.
     *
     * @param siteId - Optional site ID, uses default from config if not provided
     * @returns Array of rate limit profiles
     */
    public async getRateLimitProfiles(siteId?: string, customHeaders?: CustomHeaders): Promise<RateLimitProfile[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const response = await this.request.get<OmadaApiResponse<RateLimitProfile[]>>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/rate-limit-profiles`),
            undefined,
            customHeaders
        );
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Set custom rate limit for a client.
     * Configures download and upload bandwidth limits directly without using a profile.
     *
     * @param clientMac - MAC address of the client
     * @param downLimit - Download limit in Kbps
     * @param upLimit - Upload limit in Kbps
     * @param siteId - Optional site ID, uses default from config if not provided
     * @returns Updated rate limit setting
     */
    public async setClientRateLimit(
        clientMac: string,
        downLimit: number,
        upLimit: number,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<ClientRateLimitSetting> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const requestBody: UpdateClientRateLimitRequest = {
            mode: 0, // 0 = custom rate limit
            customRateLimit: {
                enable: true,
                upEnable: true,
                upLimit: upLimit,
                downEnable: true,
                downLimit: downLimit,
            },
        };

        const response = await this.request.patch<OmadaApiResponse<ClientRateLimitSetting>>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients/${encodeURIComponent(clientMac)}/ratelimit`),
            requestBody,
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Set rate limit profile for a client.
     * Applies a predefined rate limit profile to the client.
     *
     * @param clientMac - MAC address of the client
     * @param profileId - Rate limit profile ID
     * @param siteId - Optional site ID, uses default from config if not provided
     * @returns Updated rate limit setting
     */
    public async setClientRateLimitProfile(
        clientMac: string,
        profileId: string,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<ClientRateLimitSetting> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const requestBody: UpdateClientRateLimitRequest = {
            mode: 1, // 1 = use rate limit profile
            rateLimitProfileId: profileId,
        };

        const response = await this.request.patch<OmadaApiResponse<ClientRateLimitSetting>>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients/${encodeURIComponent(clientMac)}/ratelimit`),
            requestBody,
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Disable rate limit for a client.
     * Removes any rate limiting applied to the client.
     *
     * @param clientMac - MAC address of the client
     * @param siteId - Optional site ID, uses default from config if not provided
     * @returns Updated rate limit setting
     */
    public async disableClientRateLimit(clientMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<ClientRateLimitSetting> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);

        // To disable rate limiting, use mode 0 with enable: false and minimal valid limit values
        const requestBody: UpdateClientRateLimitRequest = {
            mode: 0,
            customRateLimit: {
                enable: false,
                upEnable: false,
                upLimit: 1,
                downEnable: false,
                downLimit: 1,
            },
        };

        const response = await this.request.patch<OmadaApiResponse<ClientRateLimitSetting>>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients/${encodeURIComponent(clientMac)}/ratelimit`),
            requestBody,
            customHeaders
        );
        return this.request.ensureSuccess(response);
    }

    /**
     * Get full detail for a single client by MAC address.
     * OperationId: getClientDetail
     */
    public async getClientDetail(clientMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients/${encodeURIComponent(clientMac)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get historical known clients list (paginated).
     * OperationId: getGridKnownClients
     */
    public async getGridKnownClients(
        page: number,
        pageSize: number,
        options?: { sortLastSeen?: string; timeStart?: string; timeEnd?: string; guest?: string; searchKey?: string },
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/insight/clients`);
        const params: Record<string, unknown> = { page, pageSize };
        if (options?.sortLastSeen !== undefined) params['sorts.lastSeen'] = options.sortLastSeen;
        if (options?.timeStart !== undefined) params['filters.timeStart'] = options.timeStart;
        if (options?.timeEnd !== undefined) params['filters.timeEnd'] = options.timeEnd;
        if (options?.guest !== undefined) params['filters.guest'] = options.guest;
        if (options?.searchKey !== undefined) params.searchKey = options.searchKey;
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, params, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get per-client connection history (paginated).
     * OperationId: getGridClientHistory
     */
    public async getGridClientHistory(
        clientMac: string,
        page: number,
        pageSize: number,
        searchKey?: string,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/clients/${encodeURIComponent(clientMac)}/client-history`);
        const params: Record<string, unknown> = { page, pageSize };
        if (searchKey !== undefined) params.searchKey = searchKey;
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, params, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get client count distribution by type/band.
     * OperationId: getClientsDistribution
     */
    public async getClientsDistribution(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/client-distribution`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get historical client count trend over a time range.
     * OperationId: getPastClientNum
     */
    public async getPastClientNum(start: number, end: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/dashboard/past-client-num`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { start, end }, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
