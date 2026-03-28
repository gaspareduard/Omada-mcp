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
        const result = this.request.ensureSuccess(response);
        return Array.isArray(result) ? result : [];
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
        const result = this.request.ensureSuccess(response);
        return Array.isArray(result) ? result : [];
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

    // -------------------------------------------------------------------------
    // Device Management — Phase 1 Read Tools (issue #36)
    // -------------------------------------------------------------------------

    /**
     * Get all devices in a site including offline devices.
     * OperationId: getAllDeviceBySite
     */
    public async getAllDeviceBySite(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/devices/all`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get latest firmware info for a device.
     * OperationId: getFirmwareInfo
     */
    public async getFirmwareInfo(deviceMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!deviceMac) throw new Error('A deviceMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/devices/${encodeURIComponent(deviceMac)}/latest-firmware-info`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get auto-check upgrade plan list.
     * OperationId: getGridAutoCheckUpgrade
     */
    public async getGridAutoCheckUpgrade(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/upgrade/autoCheck');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * List switch VLAN network assignments.
     * OperationId: listSwitchNetworks
     */
    public async listSwitchNetworks(
        switchMac: string,
        page: number,
        pageSize: number,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        if (!switchMac) throw new Error('A switchMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/switches/${encodeURIComponent(switchMac)}/networks`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get switch general configuration.
     * OperationId: getGeneralConfig (switch)
     */
    public async getSwitchGeneralConfig(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!switchMac) throw new Error('A switchMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/switches/${encodeURIComponent(switchMac)}/general-config`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get cable test logs for a switch.
     * OperationId: getCableTestLogs
     */
    public async getCableTestLogs(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!switchMac) throw new Error('A switchMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/cable-test/switches/${encodeURIComponent(switchMac)}/logs`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get cable test full results for a switch.
     * OperationId: getCableTestFullResults
     */
    public async getCableTestFullResults(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!switchMac) throw new Error('A switchMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/cable-test/switches/${encodeURIComponent(switchMac)}/full-results`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get stack LAG list.
     * OperationId: getOswStackLagList
     */
    public async getOswStackLagList(stackId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        if (!stackId) throw new Error('A stackId must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/stacks/${encodeURIComponent(stackId)}/lags`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get stack VLAN network list.
     * OperationId: getStackNetworkList
     */
    public async getStackNetworkList(
        stackId: string,
        page: number,
        pageSize: number,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        if (!stackId) throw new Error('A stackId must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/stacks/${encodeURIComponent(stackId)}/networks`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get AP uplink configuration.
     * OperationId: getApUplinkConfig
     */
    public async getApUplinkConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/uplink-config`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get AP per-radio configuration.
     * OperationId: getRadiosConfig
     */
    public async getRadiosConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/radio-config`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get AP VLAN configuration.
     * OperationId: getApVlanConfig
     */
    public async getApVlanConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/vlan`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get per-AP mesh link statistics.
     * OperationId: getMeshStatistics
     */
    public async getMeshStatistics(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/mesh/statistics`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get RF scan results for an AP.
     * OperationId: getRFScanResult
     */
    public async getRFScanResult(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/rf-scan-result`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get speed test results for an AP.
     * OperationId: getSpeedTestResults
     */
    public async getSpeedTestResults(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/speed-test-result`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get AP SNMP configuration.
     * OperationId: getApSnmpConfig
     */
    public async getApSnmpConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/snmp`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get AP LLDP configuration.
     * OperationId: getApLldpConfig
     */
    public async getApLldpConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/lldp`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get AP general configuration.
     * OperationId: getGeneralConfig_2
     */
    public async getApGeneralConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/general-config`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get AP wired uplink detail.
     * OperationId: getUplinkWiredDetail
     */
    public async getUplinkWiredDetail(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/wired-uplink`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    /**
     * Get AP wired downlink device list.
     * OperationId: getDownlinkWiredDevices
     */
    public async getDownlinkWiredDevices(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/wired-downlink`);
        const response = await this.request.get<OmadaApiResponse<{ wiredDownlinkList?: unknown[] }>>(path, undefined, customHeaders);
        const result = this.request.ensureSuccess(response) as { wiredDownlinkList?: unknown[] };
        return result?.wiredDownlinkList ?? [];
    }

    // -------------------------------------------------------------------------
    // Device Management — Phase 2 Read Tools (issue #73)
    // -------------------------------------------------------------------------

    // --- devices-general ---

    public async getFirmwareUpgradePlan(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/upgrade/overview/plans');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getUpgradeLogs(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/upgrade/overview/logs');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getDeviceTagList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/devices/tag`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    // --- devices-ap ---

    public async getApQosConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/qos`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getApIpv6Config(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/ipv6-setting`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    // -------------------------------------------------------------------------
    // Device Management — Phase 2 additional Read Tools (issue #73)
    // -------------------------------------------------------------------------

    // --- devices-gateway new ---

    public async getSitesGatewaysGeneralConfig(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!gatewayMac) throw new Error('A gatewayMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/gateways/${encodeURIComponent(gatewayMac)}/general-config`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesGatewaysPin(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!gatewayMac) throw new Error('A gatewayMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/gateways/${encodeURIComponent(gatewayMac)}/pin`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesGatewaysSimCardUsed(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!gatewayMac) throw new Error('A gatewayMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/gateways/${encodeURIComponent(gatewayMac)}/simCardUsed`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesHealthGatewaysWansDetails(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!gatewayMac) throw new Error('A gatewayMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/health/gateways/${encodeURIComponent(gatewayMac)}/wans/details`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    // --- devices-ap new ---

    public async getSitesApsIpSetting(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/ip-setting`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesApsChannelLimit(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/channel-limit`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesApsAvailableChannel(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/available-channel`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesApsLoadBalance(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/load-balance`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesApsOfdma(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/ofdma`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesApsPowerSaving(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/power-saving`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesApsTrunkSetting(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/trunk-setting`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesApsBridge(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/bridge`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async listSitesApsPorts(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        if (!apMac) throw new Error('An apMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/aps/${encodeURIComponent(apMac)}/ports`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        const result = this.request.ensureSuccess(response);
        return Array.isArray(result) ? result : [];
    }

    // --- devices-switch new ---

    public async getSitesSwitchesEs(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!switchMac) throw new Error('A switchMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/switches/es/${encodeURIComponent(switchMac)}`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesSwitchesEsGeneralConfig(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!switchMac) throw new Error('A switchMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/switches/es/${encodeURIComponent(switchMac)}/general-config`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async listSitesCableTestSwitchesPorts(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        if (!switchMac) throw new Error('A switchMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/cable-test/switches/${encodeURIComponent(switchMac)}/ports`);
        const response = await this.request.get<OmadaApiResponse<unknown[]>>(path, undefined, customHeaders);
        const result = this.request.ensureSuccess(response);
        return Array.isArray(result) ? result : [];
    }

    public async listSitesCableTestSwitchesIncrementResults(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        if (!switchMac) throw new Error('A switchMac must be provided.');
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(
            `/sites/${encodeURIComponent(resolvedSiteId)}/cable-test/switches/${encodeURIComponent(switchMac)}/increment-results`
        );
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    // --- devices-general new ---

    public async getUpgradeOverviewCritical(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/upgrade/overview/critical');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getUpgradeOverviewTryBeta(customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/upgrade/overview/try-beta');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, undefined, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async listUpgradeFirmwares(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/upgrade/firmwares');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async listUpgradeOverviewFirmwares(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const path = this.buildPath('/upgrade/overview/firmwares');
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page, pageSize }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async listSitesStacks(siteId?: string, page?: number, pageSize?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/stacks`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page: page ?? 1, pageSize: pageSize ?? 10 }, customHeaders);
        return this.request.ensureSuccess(response);
    }

    public async getSitesDeviceWhiteList(siteId?: string, page?: number, pageSize?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        const resolvedSiteId = this.site.resolveSiteId(siteId);
        const path = this.buildPath(`/sites/${encodeURIComponent(resolvedSiteId)}/device-white-list`);
        const response = await this.request.get<OmadaApiResponse<unknown>>(path, { page: page ?? 1, pageSize: pageSize ?? 10 }, customHeaders);
        return this.request.ensureSuccess(response);
    }
}
