import type { CustomHeaders, GetDeviceStatsOptions, OmadaApiResponse, OmadaDeviceInfo, OmadaDeviceStats, OswStackDetail } from '../types/index.js';

import type { RequestHandler } from './request.js';
import type { SiteOperations } from './site.js';

/**
 * Device-related operations for the Omada API.
 */
export class DeviceOperations {
    constructor(
        private readonly request: RequestHandler,
        private readonly site: SiteOperations,
        private readonly buildPath: (path: string) => string
    ) {}

    /**
     * List all devices in a site.
     */
    public async listDevices(siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaDeviceInfo[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        return await this.request.fetchPaginated<OmadaDeviceInfo>(
            this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/devices`),
            {},
            customHeaders
        );
    }

    /**
     * Get a specific device by MAC address or device ID.
     */
    public async getDevice(identifier: string, siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaDeviceInfo | undefined> {
        const devices = await this.listDevices(siteId, customHeaders);
        return devices.find((device) => device.mac === identifier || device.deviceId === identifier);
    }

    /**
     * Get detailed information about a switch stack.
     */
    public async getSwitchStackDetail(stackId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<OswStackDetail> {
        if (!stackId) {
            throw new Error('A stack id must be provided.');
        }

        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/stacks/${encodeURIComponent(stackId)}`);

        const response = await this.request.get<OmadaApiResponse<OswStackDetail>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Search for devices globally across all sites the user has access to.
     */
    public async searchDevices(searchKey: string, customHeaders?: CustomHeaders): Promise<OmadaDeviceInfo[]> {
        if (!searchKey) {
            throw new Error('A search key must be provided.');
        }

        const path = this.buildPath(`/devices?searchKey=${encodeURIComponent(searchKey)}`);
        const response = await this.request.get<OmadaApiResponse<OmadaDeviceInfo[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get statistics for global adopted devices with filtering and pagination.
     */
    public async listDevicesStats(options: GetDeviceStatsOptions, customHeaders?: CustomHeaders): Promise<OmadaDeviceStats> {
        const queryParams = new URLSearchParams();
        queryParams.append('page', options.page.toString());
        queryParams.append('pageSize', options.pageSize.toString());

        if (options.searchMacs) {
            queryParams.append('searchMacs', options.searchMacs);
        }
        if (options.searchNames) {
            queryParams.append('searchNames', options.searchNames);
        }
        if (options.searchModels) {
            queryParams.append('searchModels', options.searchModels);
        }
        if (options.searchSns) {
            queryParams.append('searchSns', options.searchSns);
        }
        if (options.filterTag) {
            queryParams.append('filters.tag', options.filterTag);
        }
        if (options.filterDeviceSeriesType) {
            queryParams.append('filters.deviceSeriesType', options.filterDeviceSeriesType);
        }

        const path = this.buildPath(`/devices/stat?${queryParams.toString()}`);
        const response = await this.request.get<OmadaApiResponse<OmadaDeviceStats>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get detailed information for a specific switch.
     * OperationId: getSwitch
     */
    public async getSwitchDetail(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!switchMac) {
            throw new Error('A switchMac must be provided.');
        }
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/switches/${encodeURIComponent(switchMac)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get detailed information for a specific gateway.
     * OperationId: getGateway
     */
    public async getGatewayDetail(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!gatewayMac) {
            throw new Error('A gatewayMac must be provided.');
        }
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/gateways/${encodeURIComponent(gatewayMac)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get WAN status for a specific gateway.
     * OperationId: getGatewayWanPortStatus
     */
    public async getGatewayWanStatus(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!gatewayMac) {
            throw new Error('A gatewayMac must be provided.');
        }
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/gateways/${encodeURIComponent(gatewayMac)}/wan-status`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get LAN status for a specific gateway.
     * OperationId: getGatewayLanPortStatus
     */
    public async getGatewayLanStatus(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!gatewayMac) {
            throw new Error('A gatewayMac must be provided.');
        }
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/gateways/${encodeURIComponent(gatewayMac)}/lan-status`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get port information for a specific gateway.
     * OperationId: getGatewayPorts
     */
    public async getGatewayPorts(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        if (!gatewayMac) {
            throw new Error('A gatewayMac must be provided.');
        }
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/gateways/${encodeURIComponent(gatewayMac)}/ports`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get detailed information for a specific AP.
     * OperationId: getAp
     */
    public async getApDetail(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) {
            throw new Error('An apMac must be provided.');
        }
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get radio information for a specific AP.
     * OperationId: getApRadios
     */
    public async getApRadios(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        if (!apMac) {
            throw new Error('An apMac must be provided.');
        }
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/radios`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response) ?? [];
    }

    /**
     * Get port information for a switch stack.
     * OperationId: getStackPorts
     */
    public async getStackPorts(stackId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        if (!stackId) {
            throw new Error('A stackId must be provided.');
        }
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/stacks/${encodeURIComponent(stackId)}/ports`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }

    /**
     * List devices pending adoption in a site.
     * OperationId: getGridPendingDevices
     */
    public async listPendingDevices(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/grid/devices/pending`);
        return await this.request.fetchPaginated<unknown>(path, {}, customHeaders);
    }
}
