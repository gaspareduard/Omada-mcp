import https from 'node:https';

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

import type { OmadaConnectionConfig } from '../config.js';
import type {
    ActiveClientInfo,
    ClientActivity,
    ClientPastConnection,
    ClientRateLimitSetting,
    CustomHeaders,
    GetClientActivityOptions,
    GetDeviceStatsOptions,
    GetThreatListOptions,
    ListClientsPastConnectionsOptions,
    OmadaClientInfo,
    OmadaDeviceInfo,
    OmadaDeviceStats,
    OmadaSiteSummary,
    OswStackDetail,
    PaginatedResult,
    RateLimitProfile,
    ThreatInfo,
} from '../types/index.js';

import { AccountOperations } from './account.js';
import { ActionOperations } from './actions.js';
import { AuthManager } from './auth.js';
import { ClientOperations } from './client.js';
import { ControllerOperations } from './controller.js';
import { DeviceOperations } from './device.js';
import { InsightOperations, type SiteThreatListOptions } from './insight.js';
import { LogOperations, type LogQueryOptions } from './log.js';
import type { FileServerConfig, SiteFileRestoreInfo, SiteRestoreInfo } from './maintenance.js';
import { MaintenanceOperations } from './maintenance.js';
import { MonitorOperations } from './monitor.js';
import { NetworkOperations } from './network.js';
import { RequestHandler } from './request.js';
import { ScheduleOperations } from './schedules.js';
import { SecurityOperations } from './security.js';
import { SiteOperations } from './site.js';

export type { LogQueryOptions, SiteThreatListOptions };

export type OmadaClientOptions = OmadaConnectionConfig;

/**
 * Main client for interacting with the TP-Link Omada API.
 * Organized by API tag with dedicated operation classes for each domain.
 */
export class OmadaClient {
    private readonly http: AxiosInstance;

    private readonly auth: AuthManager;

    private readonly request: RequestHandler;

    private readonly siteOps: SiteOperations;

    private readonly deviceOps: DeviceOperations;

    private readonly clientOps: ClientOperations;

    private readonly securityOps: SecurityOperations;

    private readonly networkOps: NetworkOperations;

    private readonly monitorOps: MonitorOperations;

    private readonly insightOps: InsightOperations;

    private readonly logOps: LogOperations;

    private readonly controllerOps: ControllerOperations;

    private readonly maintenanceOps: MaintenanceOperations;

    private readonly accountOps: AccountOperations;

    private readonly scheduleOps: ScheduleOperations;

    private readonly actionOps: ActionOperations;

    private readonly omadacId: string;

    constructor(options: OmadaClientOptions) {
        this.omadacId = options.omadacId;

        const axiosOptions: AxiosRequestConfig = {
            baseURL: options.baseUrl,
            httpsAgent: new https.Agent({ rejectUnauthorized: options.strictSsl }),
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        };

        if (options.requestTimeout) {
            axiosOptions.timeout = options.requestTimeout;
        }

        this.http = axios.create(axiosOptions);

        // Initialize operation modules
        this.auth = new AuthManager(this.http, options.clientId, options.clientSecret, options.omadacId);
        this.request = new RequestHandler(this.http, this.auth);
        this.siteOps = new SiteOperations(this.request, this.buildOmadaPath.bind(this), options.siteId);
        this.deviceOps = new DeviceOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
        this.clientOps = new ClientOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
        this.securityOps = new SecurityOperations(this.request, this.buildOmadaPath.bind(this));
        this.networkOps = new NetworkOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
        this.monitorOps = new MonitorOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
        this.insightOps = new InsightOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
        this.logOps = new LogOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
        this.controllerOps = new ControllerOperations(this.request, this.buildOmadaPath.bind(this));
        this.maintenanceOps = new MaintenanceOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
        this.accountOps = new AccountOperations(this.request, this.buildOmadaPath.bind(this));
        this.scheduleOps = new ScheduleOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
        this.actionOps = new ActionOperations(this.request, this.siteOps, this.buildOmadaPath.bind(this));
    }

    // Site operations
    public async listSites(customHeaders?: CustomHeaders): Promise<OmadaSiteSummary[]> {
        return await this.siteOps.listSites(customHeaders);
    }

    // Device operations
    public async listDevices(siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaDeviceInfo[]> {
        return await this.deviceOps.listDevices(siteId, customHeaders);
    }

    public async getDevice(identifier: string, siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaDeviceInfo | undefined> {
        return await this.deviceOps.getDevice(identifier, siteId, customHeaders);
    }

    public async getSwitchStackDetail(stackId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<OswStackDetail> {
        return await this.deviceOps.getSwitchStackDetail(stackId, siteId, customHeaders);
    }

    public async searchDevices(searchKey: string, customHeaders?: CustomHeaders): Promise<OmadaDeviceInfo[]> {
        return await this.deviceOps.searchDevices(searchKey, customHeaders);
    }

    public async listDevicesStats(options: GetDeviceStatsOptions, customHeaders?: CustomHeaders): Promise<OmadaDeviceStats> {
        return await this.deviceOps.listDevicesStats(options, customHeaders);
    }

    // Client operations
    public async listClients(siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaClientInfo[]> {
        return await this.clientOps.listClients(siteId, customHeaders);
    }

    public async getClient(identifier: string, siteId?: string, customHeaders?: CustomHeaders): Promise<OmadaClientInfo | undefined> {
        return await this.clientOps.getClient(identifier, siteId, customHeaders);
    }

    public async listMostActiveClients(siteId?: string, customHeaders?: CustomHeaders): Promise<ActiveClientInfo[]> {
        return await this.clientOps.listMostActiveClients(siteId, customHeaders);
    }

    public async listClientsActivity(options?: GetClientActivityOptions, customHeaders?: CustomHeaders): Promise<ClientActivity[]> {
        return await this.clientOps.listClientsActivity(options, customHeaders);
    }

    public async listClientsPastConnections(
        options: ListClientsPastConnectionsOptions,
        customHeaders?: CustomHeaders
    ): Promise<ClientPastConnection[]> {
        return await this.clientOps.listClientsPastConnections(options, customHeaders);
    }

    // Rate limit operations
    public async getRateLimitProfiles(siteId?: string, customHeaders?: CustomHeaders): Promise<RateLimitProfile[]> {
        return await this.clientOps.getRateLimitProfiles(siteId, customHeaders);
    }

    public async setClientRateLimit(
        clientMac: string,
        downLimit: number,
        upLimit: number,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<ClientRateLimitSetting> {
        return await this.clientOps.setClientRateLimit(clientMac, downLimit, upLimit, siteId, customHeaders);
    }

    public async setClientRateLimitProfile(
        clientMac: string,
        profileId: string,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<ClientRateLimitSetting> {
        return await this.clientOps.setClientRateLimitProfile(clientMac, profileId, siteId, customHeaders);
    }

    public async disableClientRateLimit(clientMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<ClientRateLimitSetting> {
        return await this.clientOps.disableClientRateLimit(clientMac, siteId, customHeaders);
    }

    public async getClientDetail(clientMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.clientOps.getClientDetail(clientMac, siteId, customHeaders);
    }

    public async getGridKnownClients(
        page: number,
        pageSize: number,
        options?: { sortLastSeen?: string; timeStart?: string; timeEnd?: string; guest?: string; searchKey?: string },
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.clientOps.getGridKnownClients(page, pageSize, options, siteId, customHeaders);
    }

    public async getGridClientHistory(
        clientMac: string,
        page: number,
        pageSize: number,
        searchKey?: string,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.clientOps.getGridClientHistory(clientMac, page, pageSize, searchKey, siteId, customHeaders);
    }

    public async getClientsDistribution(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.clientOps.getClientsDistribution(siteId, customHeaders);
    }

    public async getPastClientNum(start: number, end: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.clientOps.getPastClientNum(start, end, siteId, customHeaders);
    }

    // Security operations
    public async getThreatList(options: GetThreatListOptions, customHeaders?: CustomHeaders): Promise<PaginatedResult<ThreatInfo>> {
        return await this.securityOps.getThreatList(options, customHeaders);
    }

    // Network operations
    public async getInternetInfo(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getInternetInfo(siteId, customHeaders);
    }

    public async getPortForwardingStatus(
        type: 'user' | 'upnp',
        siteId?: string,
        page = 1,
        pageSize = 10,
        customHeaders?: CustomHeaders
    ): Promise<PaginatedResult<unknown>> {
        return await this.networkOps.getPortForwardingStatus(type, siteId, page, pageSize, customHeaders);
    }

    public async getLanNetworkList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.getLanNetworkList(siteId, customHeaders);
    }

    public async getLanProfileList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.getLanProfileList(siteId, customHeaders);
    }

    public async getWlanGroupList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.getWlanGroupList(siteId, customHeaders);
    }

    public async getSsidList(wlanId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.getSsidList(wlanId, siteId, customHeaders);
    }

    public async getSsidDetail(wlanId: string, ssidId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSsidDetail(wlanId, ssidId, siteId, customHeaders);
    }

    public async getFirewallSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getFirewallSetting(siteId, customHeaders);
    }

    public async setFirewallSetting(payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.setFirewallSetting(payload, siteId, customHeaders);
    }

    public async getSwitchDetail(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSwitchDetail(switchMac, siteId, customHeaders);
    }

    public async getGatewayDetail(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getGatewayDetail(gatewayMac, siteId, customHeaders);
    }

    public async getGatewayWanStatus(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getGatewayWanStatus(gatewayMac, siteId, customHeaders);
    }

    public async getGatewayLanStatus(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getGatewayLanStatus(gatewayMac, siteId, customHeaders);
    }

    public async getGatewayPorts(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.getGatewayPorts(gatewayMac, siteId, customHeaders);
    }

    public async getApDetail(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getApDetail(apMac, siteId, customHeaders);
    }

    public async getApRadios(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.getApRadios(apMac, siteId, customHeaders);
    }

    public async getStackPorts(stackId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.getStackPorts(stackId, siteId, customHeaders);
    }

    public async listPendingDevices(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.listPendingDevices(siteId, customHeaders);
    }

    // Device Management — Phase 1 Read Tools (issue #36)
    public async getAllDeviceBySite(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.getAllDeviceBySite(siteId, customHeaders);
    }
    public async getFirmwareInfo(deviceMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getFirmwareInfo(deviceMac, siteId, customHeaders);
    }

    public async rebootDevice(deviceMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.actionOps.rebootDevice(deviceMac, siteId, customHeaders);
    }

    public async blockClient(clientMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.actionOps.blockClient(clientMac, siteId, customHeaders);
    }

    public async unblockClient(clientMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.actionOps.unblockClient(clientMac, siteId, customHeaders);
    }

    public async reconnectClient(clientMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.actionOps.reconnectClient(clientMac, siteId, customHeaders);
    }

    public async setDeviceLed(deviceMac: string, ledSetting: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.actionOps.setDeviceLed(deviceMac, ledSetting, siteId, customHeaders);
    }
    public async getGridAutoCheckUpgrade(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getGridAutoCheckUpgrade(page, pageSize, customHeaders);
    }
    public async listSwitchNetworks(
        switchMac: string,
        page: number,
        pageSize: number,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.listSwitchNetworks(switchMac, page, pageSize, siteId, customHeaders);
    }
    public async getSwitchGeneralConfig(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSwitchGeneralConfig(switchMac, siteId, customHeaders);
    }
    public async getCableTestLogs(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getCableTestLogs(switchMac, siteId, customHeaders);
    }
    public async getCableTestFullResults(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getCableTestFullResults(switchMac, siteId, customHeaders);
    }
    public async getOswStackLagList(stackId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.getOswStackLagList(stackId, siteId, customHeaders);
    }
    public async getStackNetworkList(
        stackId: string,
        page: number,
        pageSize: number,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.getStackNetworkList(stackId, page, pageSize, siteId, customHeaders);
    }
    public async getApUplinkConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.getApUplinkConfig(apMac, siteId, customHeaders);
    }
    public async getRadiosConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getRadiosConfig(apMac, siteId, customHeaders);
    }
    public async getApVlanConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getApVlanConfig(apMac, siteId, customHeaders);
    }
    public async getMeshStatistics(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getMeshStatistics(apMac, siteId, customHeaders);
    }
    public async getRFScanResult(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getRFScanResult(apMac, siteId, customHeaders);
    }
    public async getSpeedTestResults(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSpeedTestResults(apMac, siteId, customHeaders);
    }
    public async getApSnmpConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getApSnmpConfig(apMac, siteId, customHeaders);
    }
    public async getApLldpConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getApLldpConfig(apMac, siteId, customHeaders);
    }
    public async getApGeneralConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getApGeneralConfig(apMac, siteId, customHeaders);
    }
    public async setApGeneralConfig(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setApGeneralConfig(apMac, payload, siteId, customHeaders);
    }
    public async getUplinkWiredDetail(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getUplinkWiredDetail(apMac, siteId, customHeaders);
    }
    public async getDownlinkWiredDevices(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.getDownlinkWiredDevices(apMac, siteId, customHeaders);
    }

    // Device Management — Phase 2 Read Tools (issue #73)

    // devices-general
    public async getFirmwareUpgradePlan(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getFirmwareUpgradePlan(page, pageSize, customHeaders);
    }
    public async getUpgradeLogs(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getUpgradeLogs(page, pageSize, customHeaders);
    }
    public async getDeviceTagList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getDeviceTagList(siteId, customHeaders);
    }

    // devices-ap
    public async getApQosConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getApQosConfig(apMac, siteId, customHeaders);
    }
    public async setApQosConfig(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setApQosConfig(apMac, payload, siteId, customHeaders);
    }
    public async getApIpv6Config(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getApIpv6Config(apMac, siteId, customHeaders);
    }
    public async setApIpv6Config(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setApIpv6Config(apMac, payload, siteId, customHeaders);
    }

    // Device operations — Phase 2 additional

    public async getSitesGatewaysGeneralConfig(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesGatewaysGeneralConfig(gatewayMac, siteId, customHeaders);
    }

    public async setSitesGatewaysGeneralConfig(
        gatewayMac: string,
        payload: unknown,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.setSitesGatewaysGeneralConfig(gatewayMac, payload, siteId, customHeaders);
    }

    public async setSitesGatewaysConfigGeneral(
        gatewayMac: string,
        payload: unknown,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.setSitesGatewaysConfigGeneral(gatewayMac, payload, siteId, customHeaders);
    }

    public async setSitesGatewaysConfigServices(
        gatewayMac: string,
        payload: unknown,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.setSitesGatewaysConfigServices(gatewayMac, payload, siteId, customHeaders);
    }

    public async setSitesGatewaysConfigAdvanced(
        gatewayMac: string,
        payload: unknown,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.setSitesGatewaysConfigAdvanced(gatewayMac, payload, siteId, customHeaders);
    }

    public async setSitesGatewaysConfigRadios(
        gatewayMac: string,
        payload: unknown,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.setSitesGatewaysConfigRadios(gatewayMac, payload, siteId, customHeaders);
    }

    public async setSitesGatewaysConfigWlans(gatewayMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setSitesGatewaysConfigWlans(gatewayMac, payload, siteId, customHeaders);
    }

    public async setSitesGatewaysPortConfig(
        gatewayMac: string,
        portName: string,
        payload: unknown,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.setSitesGatewaysPortConfig(gatewayMac, portName, payload, siteId, customHeaders);
    }

    public async setSitesGatewaysMultiPortsConfig(
        gatewayMac: string,
        payload: unknown,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.setSitesGatewaysMultiPortsConfig(gatewayMac, payload, siteId, customHeaders);
    }

    public async getSitesGatewaysPin(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesGatewaysPin(gatewayMac, siteId, customHeaders);
    }

    public async getSitesGatewaysSimCardUsed(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesGatewaysSimCardUsed(gatewayMac, siteId, customHeaders);
    }

    public async getSitesHealthGatewaysWansDetails(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesHealthGatewaysWansDetails(gatewayMac, siteId, customHeaders);
    }

    public async getSitesApsIpSetting(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesApsIpSetting(apMac, siteId, customHeaders);
    }

    public async setSitesApsIpSetting(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setSitesApsIpSetting(apMac, payload, siteId, customHeaders);
    }

    public async getSitesApsChannelLimit(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesApsChannelLimit(apMac, siteId, customHeaders);
    }

    public async getSitesApsAvailableChannel(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesApsAvailableChannel(apMac, siteId, customHeaders);
    }

    public async setApChannelConfig(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setApChannelConfig(apMac, payload, siteId, customHeaders);
    }

    public async getAfcConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getAfcConfig(apMac, siteId, customHeaders);
    }

    public async setAfcConfig(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setAfcConfig(apMac, payload, siteId, customHeaders);
    }

    public async getSitesApsLoadBalance(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesApsLoadBalance(apMac, siteId, customHeaders);
    }

    public async setSitesApsLoadBalance(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setSitesApsLoadBalance(apMac, payload, siteId, customHeaders);
    }

    public async getSitesApsOfdma(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesApsOfdma(apMac, siteId, customHeaders);
    }

    public async setSitesApsOfdma(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setSitesApsOfdma(apMac, payload, siteId, customHeaders);
    }

    public async getSitesApsPowerSaving(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesApsPowerSaving(apMac, siteId, customHeaders);
    }

    public async setSitesApsPowerSaving(
        apMac: string,
        payload: {
            timeEnable: boolean;
            bandEnable: boolean;
            startTimeH?: number;
            startTimeM?: number;
            endTimeH?: number;
            endTimeM?: number;
            bands?: number[];
            idleDuration?: number;
        },
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.setSitesApsPowerSaving(apMac, payload, siteId, customHeaders);
    }

    public async getSitesApsTrunkSetting(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesApsTrunkSetting(apMac, siteId, customHeaders);
    }

    public async setSitesApsTrunkSetting(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setSitesApsTrunkSetting(apMac, payload, siteId, customHeaders);
    }

    public async setSitesApsChannelLimit(
        apMac: string,
        payload: {
            channelLimitType: number;
        },
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.deviceOps.setSitesApsChannelLimit(apMac, payload, siteId, customHeaders);
    }

    public async getSitesApsBridge(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesApsBridge(apMac, siteId, customHeaders);
    }

    public async setSitesApsBridge(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setSitesApsBridge(apMac, payload, siteId, customHeaders);
    }

    public async setRadiosConfig(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setRadiosConfig(apMac, payload, siteId, customHeaders);
    }

    public async listSitesApsPorts(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.listSitesApsPorts(apMac, siteId, customHeaders);
    }

    public async setSitesApsPortConfig(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setSitesApsPortConfig(apMac, payload, siteId, customHeaders);
    }

    public async setApServiceConfig(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setApServiceConfig(apMac, payload, siteId, customHeaders);
    }

    public async setApWlanGroup(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setApWlanGroup(apMac, payload, siteId, customHeaders);
    }

    public async getAntennaGainConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getAntennaGainConfig(apMac, siteId, customHeaders);
    }

    public async setAntennaGainConfig(apMac: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.setAntennaGainConfig(apMac, payload, siteId, customHeaders);
    }

    public async getSitesSwitchesEs(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesSwitchesEs(switchMac, siteId, customHeaders);
    }

    public async getSitesSwitchesEsGeneralConfig(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesSwitchesEsGeneralConfig(switchMac, siteId, customHeaders);
    }

    public async listSitesCableTestSwitchesPorts(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.deviceOps.listSitesCableTestSwitchesPorts(switchMac, siteId, customHeaders);
    }

    public async listSitesCableTestSwitchesIncrementResults(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.listSitesCableTestSwitchesIncrementResults(switchMac, siteId, customHeaders);
    }

    public async getUpgradeOverviewCritical(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getUpgradeOverviewCritical(customHeaders);
    }

    public async getUpgradeOverviewTryBeta(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getUpgradeOverviewTryBeta(customHeaders);
    }

    public async listUpgradeFirmwares(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.listUpgradeFirmwares(page, pageSize, customHeaders);
    }

    public async listUpgradeOverviewFirmwares(page: number, pageSize: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.listUpgradeOverviewFirmwares(page, pageSize, customHeaders);
    }

    public async listSitesStacks(siteId?: string, page?: number, pageSize?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.listSitesStacks(siteId, page, pageSize, customHeaders);
    }

    public async getSitesDeviceWhiteList(siteId?: string, page?: number, pageSize?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getSitesDeviceWhiteList(siteId, page, pageSize, customHeaders);
    }

    // Security operations (extended)
    public async getTopThreats(customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.securityOps.getTopThreats(customHeaders);
    }

    public async getThreatSeverity(startTime: number, endTime: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getThreatSeverity(startTime, endTime, customHeaders);
    }

    // Global Controller settings (issue #41)
    public async getControllerStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getControllerStatus(customHeaders);
    }

    public async getGeneralSettings(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getGeneralSettings(customHeaders);
    }

    public async getRetention(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getRetention(customHeaders);
    }

    public async getClientActiveTimeout(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getClientActiveTimeout(customHeaders);
    }

    public async getRemoteLogging(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getRemoteLogging(customHeaders);
    }

    public async getRadiusServer(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getRadiusServer(customHeaders);
    }

    public async getLogging(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getLogging(customHeaders);
    }

    public async getUiInterface(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getUiInterface(customHeaders);
    }

    public async getDeviceAccessManagement(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getDeviceAccessManagement(customHeaders);
    }

    public async getWebhookForGlobal(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getWebhookForGlobal(customHeaders);
    }

    public async getWebhookLogsForGlobal(
        page: number,
        pageSize: number,
        webhookId: string,
        timeStart: number,
        timeEnd: number,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.securityOps.getWebhookLogsForGlobal(page, pageSize, webhookId, timeStart, timeEnd, customHeaders);
    }

    public async getMailServerStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getMailServerStatus(customHeaders);
    }

    // Network operations (extended)
    public async getVpnSettings(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getVpnSettings(siteId, customHeaders);
    }

    public async listSiteToSiteVpns(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listSiteToSiteVpns(siteId, customHeaders);
    }

    public async listClientToSiteVpnServers(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listClientToSiteVpnServers(siteId, customHeaders);
    }

    // VPN tools (issue #39)
    public async getSiteToSiteVpnInfo(vpnId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSiteToSiteVpnInfo(vpnId, siteId, customHeaders);
    }

    public async listWireguard(page: number, pageSize: number, searchKey?: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.listWireguard(page, pageSize, searchKey, siteId, customHeaders);
    }

    public async listWireguardPeers(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.listWireguardPeers(page, pageSize, siteId, customHeaders);
    }

    public async getWireguardSummary(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getWireguardSummary(siteId, customHeaders);
    }

    public async listClientToSiteVpnClients(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.listClientToSiteVpnClients(siteId, customHeaders);
    }

    public async getClientToSiteVpnServerInfo(vpnId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getClientToSiteVpnServerInfo(vpnId, siteId, customHeaders);
    }

    public async getSslVpnServerSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSslVpnServerSetting(siteId, customHeaders);
    }

    public async getGridIpsecFailover(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridIpsecFailover(page, pageSize, siteId, customHeaders);
    }

    // Profiles & Policies tools (issue #40)
    public async listServiceType(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.listServiceType(page, pageSize, siteId, customHeaders);
    }

    public async getServiceTypeSummary(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getServiceTypeSummary(siteId, customHeaders);
    }

    public async getGroupProfilesByType(groupType: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGroupProfilesByType(groupType, siteId, customHeaders);
    }

    public async getLdapProfileList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getLdapProfileList(siteId, customHeaders);
    }

    public async getRadiusUserList(
        page: number,
        pageSize: number,
        sortUsername?: string,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.networkOps.getRadiusUserList(page, pageSize, sortUsername, siteId, customHeaders);
    }

    public async getPPSKProfiles(type: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getPPSKProfiles(type, siteId, customHeaders);
    }

    public async listMdnsProfile(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.listMdnsProfile(siteId, customHeaders);
    }

    // --- network-wan (#74) ---

    public async getIspBandScan(portUuid: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getIspBandScan(portUuid, siteId, customHeaders);
    }

    public async getDisableNatList(page = 1, pageSize = 10, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getDisableNatList(page, pageSize, siteId, customHeaders);
    }

    public async getLtePortConfig(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getLtePortConfig(siteId, customHeaders);
    }

    public async getWanPortDetail(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getWanPortDetail(siteId, customHeaders);
    }

    public async getWanIspProfile(portUuid: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getWanIspProfile(portUuid, siteId, customHeaders);
    }

    public async getWanQosConfig(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getWanQosConfig(siteId, customHeaders);
    }

    public async getWanHealthDetail(gatewayMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.getSitesHealthGatewaysWansDetails(gatewayMac, siteId, customHeaders);
    }

    public async getWanUsageStats(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getWanUsageStats(siteId, customHeaders);
    }

    public async getWanNatConfig(page = 1, pageSize = 10, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getWanNatConfig(page, pageSize, siteId, customHeaders);
    }

    // --- network-lan (#74) ---

    public async getSwitchVlanInterface(switchMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSwitchVlanInterface(switchMac, siteId, customHeaders);
    }

    public async getLanDnsRules(page = 1, pageSize = 10, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getLanDnsRules(page, pageSize, siteId, customHeaders);
    }

    public async getLanProfileEsUsage(profileId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getLanProfileEsUsage(profileId, siteId, customHeaders);
    }

    public async getLanClientCount(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getLanClientCount(siteId, customHeaders);
    }

    // --- network-routing (#74) ---

    public async getOspfProcess(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getOspfProcess(siteId, customHeaders);
    }

    public async getOspfInterface(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getOspfInterface(siteId, customHeaders);
    }

    public async getVrrpConfig(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getVrrpConfig(siteId, customHeaders);
    }

    public async getOspfNeighbors(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getOspfNeighbors(siteId, customHeaders);
    }

    // --- network-services (#74) ---

    public async getDnsCacheDataList(page = 1, pageSize = 10, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getDnsCacheDataList(page, pageSize, siteId, customHeaders);
    }

    public async getIptvSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getIptvSetting(siteId, customHeaders);
    }

    public async getNtpSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getNtpSetting(siteId, customHeaders);
    }

    public async listPortForwardingRules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listPortForwardingRules(siteId, customHeaders);
    }

    public async getPortForwardingListPage(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getPortForwardingListPage(page, pageSize, siteId, customHeaders);
    }

    public async listOneToOneNatRules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listOneToOneNatRules(siteId, customHeaders);
    }

    public async listOsgAcls(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listOsgAcls(siteId, customHeaders);
    }

    public async listEapAcls(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listEapAcls(siteId, customHeaders);
    }

    public async listOswAcls(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listOswAcls(siteId, customHeaders);
    }

    public async listStaticRoutes(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listStaticRoutes(siteId, customHeaders);
    }

    public async listPolicyRoutes(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listPolicyRoutes(siteId, customHeaders);
    }

    public async listRadiusProfiles(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listRadiusProfiles(siteId, customHeaders);
    }

    public async listGroupProfiles(groupType?: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listGroupProfiles(groupType, siteId, customHeaders);
    }

    public async getApplicationControlStatus(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getApplicationControlStatus(siteId, customHeaders);
    }

    public async getBandwidthControl(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getBandwidthControl(siteId, customHeaders);
    }

    public async getSshSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSshSetting(siteId, customHeaders);
    }

    public async getLedSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getLedSetting(siteId, customHeaders);
    }

    public async listTimeRangeProfiles(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listTimeRangeProfiles(siteId, customHeaders);
    }

    public async listPortSchedules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listPortSchedules(siteId, customHeaders);
    }

    public async listPoeSchedules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listPoeSchedules(siteId, customHeaders);
    }

    public async getGatewayUrlFilters(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGatewayUrlFilters(siteId, customHeaders);
    }

    public async getEapUrlFilters(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getEapUrlFilters(siteId, customHeaders);
    }

    public async listAllSsids(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listAllSsids(siteId, customHeaders);
    }

    public async getWanLanStatus(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getWanLanStatus(siteId, customHeaders);
    }

    public async listBandwidthControlRules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listBandwidthControlRules(siteId, customHeaders);
    }

    // LAN/Network config tools (issue #38)
    public async getLanNetworkListV2(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getLanNetworkListV2(page, pageSize, siteId, customHeaders);
    }
    public async getInterfaceLanNetwork(type?: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getInterfaceLanNetwork(type, siteId, customHeaders);
    }
    public async getInterfaceLanNetworkV2(type?: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getInterfaceLanNetworkV2(type, siteId, customHeaders);
    }
    public async getGridPolicyRouting(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridPolicyRouting(page, pageSize, siteId, customHeaders);
    }
    public async getGridStaticRouting(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridStaticRouting(page, pageSize, siteId, customHeaders);
    }
    public async getStaticRoutingInterfaceList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getStaticRoutingInterfaceList(siteId, customHeaders);
    }
    public async getGridOtoNats(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridOtoNats(page, pageSize, siteId, customHeaders);
    }
    public async getAlg(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getAlg(siteId, customHeaders);
    }
    public async getUpnpSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getUpnpSetting(siteId, customHeaders);
    }
    public async getDdnsGrid(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getDdnsGrid(page, pageSize, siteId, customHeaders);
    }
    public async getDhcpReservationGrid(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getDhcpReservationGrid(page, pageSize, siteId, customHeaders);
    }
    public async createDhcpReservation(
        payload: {
            netId: string;
            mac: string;
            status: boolean;
            ip?: string;
            description?: string;
            confirmConflict?: boolean;
            options?: unknown[];
        },
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.networkOps.createDhcpReservation(payload, siteId, customHeaders);
    }
    public async updateDhcpReservation(
        mac: string,
        payload: {
            netId: string;
            status: boolean;
            ip?: string;
            description?: string;
            confirmConflict?: boolean;
            options?: unknown[];
        },
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.networkOps.updateDhcpReservation(mac, payload, siteId, customHeaders);
    }
    public async deleteDhcpReservation(mac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.deleteDhcpReservation(mac, siteId, customHeaders);
    }
    public async createBandwidthCtrlRule(payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.createBandwidthCtrlRule(payload, siteId, customHeaders);
    }
    public async updateBandwidthCtrlRule(ruleId: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.updateBandwidthCtrlRule(ruleId, payload, siteId, customHeaders);
    }
    public async deleteBandwidthCtrlRule(ruleId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.deleteBandwidthCtrlRule(ruleId, siteId, customHeaders);
    }
    public async setAccessControl(payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.setAccessControl(payload, siteId, customHeaders);
    }
    public async getGridIpMacBinding(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridIpMacBinding(page, pageSize, siteId, customHeaders);
    }
    public async getIpMacBindingGeneralSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getIpMacBindingGeneralSetting(siteId, customHeaders);
    }
    public async getSnmpSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSnmpSetting(siteId, customHeaders);
    }
    public async getLldpSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getLldpSetting(siteId, customHeaders);
    }
    public async getRemoteLoggingSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getRemoteLoggingSetting(siteId, customHeaders);
    }
    public async getSessionLimit(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSessionLimit(siteId, customHeaders);
    }
    public async getGridSessionLimitRule(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridSessionLimitRule(page, pageSize, siteId, customHeaders);
    }
    public async getGridBandwidthCtrlRule(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridBandwidthCtrlRule(page, pageSize, siteId, customHeaders);
    }
    public async getAccessControl(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getAccessControl(siteId, customHeaders);
    }
    public async getDnsCacheSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getDnsCacheSetting(siteId, customHeaders);
    }
    public async getDnsProxy(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getDnsProxy(siteId, customHeaders);
    }
    public async getIgmp(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getIgmp(siteId, customHeaders);
    }
    public async getInternetLoadBalance(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getInternetLoadBalance(siteId, customHeaders);
    }
    public async getWanPortsConfig(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getWanPortsConfig(siteId, customHeaders);
    }
    public async getInternetBasicPortInfo(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getInternetBasicPortInfo(siteId, customHeaders);
    }
    public async getInternet(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getInternet(siteId, customHeaders);
    }
    public async getGridVirtualWan(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridVirtualWan(page, pageSize, siteId, customHeaders);
    }

    // Wireless/SSID tools (issue #35)
    public async getSsidsBySite(type: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSsidsBySite(type, siteId, customHeaders);
    }

    public async getRadioFrequencyPlanningConfig(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getRadioFrequencyPlanningConfig(siteId, customHeaders);
    }

    public async getRadioFrequencyPlanningResult(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getRadioFrequencyPlanningResult(siteId, customHeaders);
    }

    public async getBandSteeringSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getBandSteeringSetting(siteId, customHeaders);
    }

    public async getBeaconControlSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getBeaconControlSetting(siteId, customHeaders);
    }

    public async getChannelLimitSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getChannelLimitSetting(siteId, customHeaders);
    }

    public async getMeshSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getMeshSetting(siteId, customHeaders);
    }

    public async getRoamingSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getRoamingSetting(siteId, customHeaders);
    }

    public async getOuiProfileList(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getOuiProfileList(page, pageSize, siteId, customHeaders);
    }

    public async getMacAuthSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getMacAuthSetting(siteId, customHeaders);
    }

    public async getMacAuthSsids(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getMacAuthSsids(siteId, customHeaders);
    }

    public async getMacFilteringGeneralSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getMacFilteringGeneralSetting(siteId, customHeaders);
    }

    public async getGridAllowMacFiltering(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridAllowMacFiltering(page, pageSize, siteId, customHeaders);
    }

    public async getGridDenyMacFiltering(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridDenyMacFiltering(page, pageSize, siteId, customHeaders);
    }

    public async getSwitchDot1xSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getSwitchDot1xSetting(siteId, customHeaders);
    }

    public async getEapDot1xSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getEapDot1xSetting(siteId, customHeaders);
    }

    // Firewall / ACL / IPS / URL-filter tools (issue #37)
    public async getAclConfigTypeSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getAclConfigTypeSetting(siteId, customHeaders);
    }

    public async setAclConfigTypeSetting(payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.setAclConfigTypeSetting(payload, siteId, customHeaders);
    }

    public async createOsgAcl(payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.createOsgAcl(payload, siteId, customHeaders);
    }

    public async updateOsgAcl(aclId: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.updateOsgAcl(aclId, payload, siteId, customHeaders);
    }

    public async createEapAcl(payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.createEapAcl(payload, siteId, customHeaders);
    }

    public async updateEapAcl(aclId: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.updateEapAcl(aclId, payload, siteId, customHeaders);
    }

    public async deleteAcl(aclId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.deleteAcl(aclId, siteId, customHeaders);
    }

    public async getOsgCustomAclList(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getOsgCustomAclList(page, pageSize, siteId, customHeaders);
    }

    public async getOswAclList(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getOswAclList(page, pageSize, siteId, customHeaders);
    }

    public async getIpsConfig(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getIpsConfig(siteId, customHeaders);
    }

    public async getGridSignature(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridSignature(page, pageSize, siteId, customHeaders);
    }

    public async getGridAllowList(
        page: number,
        pageSize: number,
        searchKey?: string,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.networkOps.getGridAllowList(page, pageSize, searchKey, siteId, customHeaders);
    }

    public async getGridBlockList(
        page: number,
        pageSize: number,
        searchKey?: string,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.networkOps.getGridBlockList(page, pageSize, searchKey, siteId, customHeaders);
    }

    public async getAttackDefenseSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getAttackDefenseSetting(siteId, customHeaders);
    }

    public async getUrlFilterGeneral(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getUrlFilterGeneral(siteId, customHeaders);
    }

    public async getGridGatewayRule(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridGatewayRule(page, pageSize, siteId, customHeaders);
    }

    public async getGridEapRule(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGridEapRule(page, pageSize, siteId, customHeaders);
    }

    // Monitor / dashboard operations
    public async getDashboardWifiSummary(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardWifiSummary(siteId, customHeaders);
    }

    public async getDashboardSwitchSummary(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardSwitchSummary(siteId, customHeaders);
    }

    public async getTrafficDistribution(siteId?: string, start?: number, end?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getTrafficDistribution(siteId, start, end, customHeaders);
    }

    public async getRetryAndDroppedRate(siteId?: string, start?: number, end?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getRetryAndDroppedRate(siteId, start, end, customHeaders);
    }

    public async getDashboardTrafficActivities(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardTrafficActivities(siteId, customHeaders);
    }

    public async getDashboardPoEUsage(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardPoEUsage(siteId, customHeaders);
    }

    public async getDashboardTopCpuUsage(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.monitorOps.getDashboardTopCpuUsage(siteId, customHeaders);
    }

    public async getDashboardTopMemoryUsage(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.monitorOps.getDashboardTopMemoryUsage(siteId, customHeaders);
    }

    public async getDashboardMostActiveSwitches(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.monitorOps.getDashboardMostActiveSwitches(siteId, customHeaders);
    }

    public async getDashboardMostActiveEaps(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.monitorOps.getDashboardMostActiveEaps(siteId, customHeaders);
    }

    public async getDashboardOverview(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardOverview(siteId, customHeaders);
    }

    public async getChannels(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getChannels(siteId, customHeaders);
    }

    public async getIspLoad(siteId?: string, start?: number, end?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getIspLoad(siteId, start, end, customHeaders);
    }

    public async getInterference(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getInterference(siteId, customHeaders);
    }

    public async getGridDashboardTunnelStats(siteId?: string, type?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getGridDashboardTunnelStats(siteId, type, customHeaders);
    }

    public async getGridDashboardIpsecTunnelStats(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getGridDashboardIpsecTunnelStats(siteId, customHeaders);
    }

    public async getGridDashboardOpenVpnTunnelStats(siteId?: string, type?: number, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getGridDashboardOpenVpnTunnelStats(siteId, type, customHeaders);
    }

    // Insight operations
    public async listSiteThreatManagement(
        options: SiteThreatListOptions,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<PaginatedResult<unknown>> {
        return await this.insightOps.listSiteThreatManagement(options, siteId, customHeaders);
    }

    public async getWids(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.insightOps.getWids(siteId, customHeaders);
    }

    public async getWidsBlacklist(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.insightOps.getWidsBlacklist(siteId, customHeaders);
    }

    public async getRogueAps(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.insightOps.getRogueAps(siteId, customHeaders);
    }

    public async getVpnTunnelStats(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.insightOps.getVpnTunnelStats(page, pageSize, siteId, customHeaders);
    }

    public async getIpsecVpnStats(page: number, pageSize: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.insightOps.getIpsecVpnStats(page, pageSize, siteId, customHeaders);
    }

    public async listInsightClients(
        page: number,
        pageSize: number,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<PaginatedResult<unknown>> {
        return await this.insightOps.listInsightClients(page, pageSize, siteId, customHeaders);
    }

    public async getRoutingTable(type: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.insightOps.getRoutingTable(type, siteId, customHeaders);
    }

    public async getThreatDetail(threatId: string, time?: number, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.insightOps.getThreatDetail(threatId, time, siteId, customHeaders);
    }

    // Log operations
    public async listSiteEvents(options: LogQueryOptions, siteId?: string, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        return await this.logOps.listSiteEvents(options, siteId, customHeaders);
    }

    public async listSiteAlerts(options: LogQueryOptions, siteId?: string, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        return await this.logOps.listSiteAlerts(options, siteId, customHeaders);
    }

    public async listSiteAuditLogs(options: LogQueryOptions, siteId?: string, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        return await this.logOps.listSiteAuditLogs(options, siteId, customHeaders);
    }

    public async listGlobalEvents(options: LogQueryOptions, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        return await this.logOps.listGlobalEvents(options, customHeaders);
    }

    public async listGlobalAlerts(options: LogQueryOptions, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        return await this.logOps.listGlobalAlerts(options, customHeaders);
    }

    public async listGlobalAuditLogs(options: LogQueryOptions, customHeaders?: CustomHeaders): Promise<PaginatedResult<unknown>> {
        return await this.logOps.listGlobalAuditLogs(options, customHeaders);
    }

    // Logs, Events & Alerts tools (issue #42)
    public async getLogSettingForSite(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.logOps.getLogSettingForSite(siteId, customHeaders);
    }

    public async getLogSettingForSiteV2(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.logOps.getLogSettingForSiteV2(siteId, customHeaders);
    }

    public async getAuditLogSettingForSite(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.logOps.getAuditLogSettingForSite(siteId, customHeaders);
    }

    public async getLogSettingForGlobal(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.logOps.getLogSettingForGlobal(customHeaders);
    }

    public async getLogSettingForGlobalV2(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.logOps.getLogSettingForGlobalV2(customHeaders);
    }

    public async getAuditLogSettingForGlobal(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.logOps.getAuditLogSettingForGlobal(customHeaders);
    }

    public async getAuditLogsForGlobal(
        page: number,
        pageSize: number,
        options?: {
            sortTime?: string;
            filterResult?: number;
            filterLevel?: string;
            filterAuditTypes?: string;
            filterTimes?: string;
            searchKey?: string;
        },
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.logOps.getAuditLogsForGlobal(page, pageSize, options, customHeaders);
    }

    // security-vpn additions (#75)
    public async getRadiusProxyConfig(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getRadiusProxyConfig(customHeaders);
    }

    public async getGatewayQosClassRules(page = 1, pageSize = 10, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGatewayQosClassRules(page, pageSize, siteId, customHeaders);
    }

    public async getBandwidthCtrlDetail(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getBandwidthCtrlDetail(siteId, customHeaders);
    }

    public async getAppControlRules(page = 1, pageSize = 10, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getAppControlRules(page, pageSize, siteId, customHeaders);
    }
    public async createAppControlRule(payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.createAppControlRule(payload, siteId, customHeaders);
    }
    public async updateAppControlRule(ruleId: string, payload: unknown, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.updateAppControlRule(ruleId, payload, siteId, customHeaders);
    }
    public async deleteAppControlRule(ruleId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.deleteAppControlRule(ruleId, siteId, customHeaders);
    }

    public async getAppControlCategories(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getAppControlCategories(siteId, customHeaders);
    }

    public async getApplications(
        page = 1,
        pageSize = 10,
        searchKey?: string,
        filtersFamilyId?: number,
        siteId?: string,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.networkOps.getApplications(page, pageSize, searchKey, filtersFamilyId, siteId, customHeaders);
    }

    public async getQosPolicy(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getQosPolicy(siteId, customHeaders);
    }

    public async getTrafficPriority(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getTrafficPriority(siteId, customHeaders);
    }

    public async getVpnUserList(page = 1, pageSize = 10, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getVpnUserList(page, pageSize, siteId, customHeaders);
    }

    public async getVpnUserDetail(vpnId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getVpnUserDetail(vpnId, siteId, customHeaders);
    }

    public async getGoogleLdapProfile(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getGoogleLdapProfile(siteId, customHeaders);
    }

    public async getPpskUserGroup(profileId: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getPpskUserGroup(profileId, siteId, customHeaders);
    }

    public async getUserRoleProfile(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getUserRoleProfile(customHeaders);
    }

    public async getPortalProfile(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getPortalProfile(siteId, customHeaders);
    }

    public async getMulticastRateLimit(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.networkOps.getMulticastRateLimit(siteId, customHeaders);
    }

    // Device — new AP tools (route through DeviceOperations wrappers for naming consistency)
    public async getApLoadBalance(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getApLoadBalance(apMac, siteId, customHeaders);
    }

    public async getApOfdmaConfig(apMac: string, siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.deviceOps.getApOfdmaConfig(apMac, siteId, customHeaders);
    }

    // Site detail and template operations
    public async getSiteDetail(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteDetail(siteId, customHeaders);
    }

    public async getSiteUrl(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteUrl(siteId, customHeaders);
    }

    public async getSiteNtpStatus(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteNtpStatus(siteId, customHeaders);
    }

    public async getSiteSpecification(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteSpecification(siteId, customHeaders);
    }

    public async getSiteRememberSetting(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteRememberSetting(siteId, customHeaders);
    }

    public async getSiteDeviceAccount(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteDeviceAccount(siteId, customHeaders);
    }

    public async getSiteCapacity(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteCapacity(siteId, customHeaders);
    }

    public async getSiteTemplateList(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteTemplateList(customHeaders);
    }

    public async getSiteTemplateDetail(siteTemplateId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteTemplateDetail(siteTemplateId, customHeaders);
    }

    public async getSiteTemplateConfig(siteTemplateId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.siteOps.getSiteTemplateConfig(siteTemplateId, customHeaders);
    }

    // Controller operations
    public async getDataRetention(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.controllerOps.getDataRetention(customHeaders);
    }

    public async getControllerPort(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.controllerOps.getControllerPort(customHeaders);
    }

    public async getPortalPort(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.controllerOps.getPortalPort(customHeaders);
    }

    public async getCertificate(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.controllerOps.getCertificate(customHeaders);
    }

    public async getExperienceImprovement(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.controllerOps.getExperienceImprovement(customHeaders);
    }

    public async getGlobalDashboardOverview(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.controllerOps.getGlobalDashboardOverview(customHeaders);
    }

    public async getClientHistoryDataEnable(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.controllerOps.getClientHistoryDataEnable(customHeaders);
    }

    // Maintenance operations
    public async getBackupFileList(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.getBackupFileList(customHeaders);
    }

    public async getBackupResult(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.getBackupResult(customHeaders);
    }

    public async getRestoreResult(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.getRestoreResult(customHeaders);
    }

    public async getSiteBackupResult(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.getSiteBackupResult(siteId, customHeaders);
    }

    public async getSiteBackupFileList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.getSiteBackupFileList(siteId, customHeaders);
    }

    public async getRogueApExport(siteId?: string, format?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.getRogueApExport(siteId, format, customHeaders);
    }

    public async backupController(retainUser: boolean, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.backupController(retainUser, customHeaders);
    }

    public async backupControllerToFileServer(
        serverConfig: FileServerConfig,
        filePath: string,
        retainUser: boolean,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.maintenanceOps.backupControllerToFileServer(serverConfig, filePath, retainUser, customHeaders);
    }

    public async restoreController(fileName: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.restoreController(fileName, customHeaders);
    }

    public async restoreControllerFromFileServer(
        serverConfig: FileServerConfig,
        filePath: string,
        skipDevice: boolean,
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.maintenanceOps.restoreControllerFromFileServer(serverConfig, filePath, skipDevice, customHeaders);
    }

    public async backupSites(siteIds: string[], customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.backupSites(siteIds, customHeaders);
    }

    public async backupSitesToFileServer(
        serverConfig: FileServerConfig,
        filePath: string,
        siteIds: string[],
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.maintenanceOps.backupSitesToFileServer(serverConfig, filePath, siteIds, customHeaders);
    }

    public async restoreSites(siteRestoreInfos: SiteRestoreInfo[], customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.maintenanceOps.restoreSites(siteRestoreInfos, customHeaders);
    }

    public async restoreSitesFromFileServer(
        serverConfig: FileServerConfig,
        siteInfos: SiteFileRestoreInfo[],
        customHeaders?: CustomHeaders
    ): Promise<unknown> {
        return await this.maintenanceOps.restoreSitesFromFileServer(serverConfig, siteInfos, customHeaders);
    }

    // Account operations
    public async getAllCloudUsers(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.accountOps.getAllCloudUsers(customHeaders);
    }

    public async getAllLocalUsers(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.accountOps.getAllLocalUsers(customHeaders);
    }

    public async getAllRoles(customHeaders?: CustomHeaders): Promise<unknown> {
        // Delegate to AccountOperations — single source of truth for /roles endpoint
        return await this.accountOps.getAllRoles(customHeaders);
    }

    public async getRoleDetail(roleId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.accountOps.getRoleDetail(roleId, customHeaders);
    }

    public async getAvailableRoles(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.accountOps.getAvailableRoles(customHeaders);
    }

    public async getAllUsersApp(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.accountOps.getAllUsersApp(customHeaders);
    }

    public async getCloudAccessStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.accountOps.getCloudAccessStatus(customHeaders);
    }

    public async getCloudUserInfo(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.accountOps.getCloudUserInfo(customHeaders);
    }

    public async getMfaStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.accountOps.getMfaStatus(customHeaders);
    }

    public async getRemoteBindingStatus(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.accountOps.getRemoteBindingStatus(customHeaders);
    }

    // Schedule operations
    public async getUpgradeScheduleList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.scheduleOps.getUpgradeScheduleList(siteId, customHeaders);
    }

    public async getRebootScheduleList(siteTemplateId: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.scheduleOps.getRebootScheduleList(siteTemplateId, customHeaders);
    }

    public async getPoeScheduleList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.scheduleOps.getPoeScheduleList(siteId, customHeaders);
    }

    public async getPortScheduleList(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.scheduleOps.getPortScheduleList(siteId, customHeaders);
    }

    public async getPortSchedulePorts(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.scheduleOps.getPortSchedulePorts(siteId, customHeaders);
    }

    // Generic API call
    public async callApi<T = unknown>(config: AxiosRequestConfig, customHeaders?: CustomHeaders): Promise<T> {
        return await this.request.request<T>(config, true, customHeaders);
    }

    /**
     * Build a full Omada API path from a relative path.
     * @param relativePath - The relative path to append to the base API path
     * @param version - The API version to use (default: 'v1')
     */
    private buildOmadaPath(relativePath: string, version = 'v1'): string {
        const normalized = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
        return `/openapi/${version}/${encodeURIComponent(this.omadacId)}${normalized}`;
    }
}
