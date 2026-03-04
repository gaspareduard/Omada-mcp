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

import { AuthManager } from './auth.js';
import { ClientOperations } from './client.js';
import { DeviceOperations } from './device.js';
import { InsightOperations, type SiteThreatListOptions } from './insight.js';
import { LogOperations, type LogQueryOptions } from './log.js';
import { MonitorOperations } from './monitor.js';
import { NetworkOperations } from './network.js';
import { RequestHandler } from './request.js';
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

    // Security operations (extended)
    public async getTopThreats(customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.securityOps.getTopThreats(customHeaders);
    }

    public async getThreatSeverity(customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.securityOps.getThreatSeverity(customHeaders);
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

    public async listPortForwardingRules(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown[]> {
        return await this.networkOps.listPortForwardingRules(siteId, customHeaders);
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

    // Monitor / dashboard operations
    public async getDashboardWifiSummary(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardWifiSummary(siteId, customHeaders);
    }

    public async getDashboardSwitchSummary(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardSwitchSummary(siteId, customHeaders);
    }

    public async getDashboardTrafficDistribution(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardTrafficDistribution(siteId, customHeaders);
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

    public async getDashboardChannels(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardChannels(siteId, customHeaders);
    }

    public async getDashboardIspLoad(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.monitorOps.getDashboardIspLoad(siteId, customHeaders);
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

    public async getVpnTunnelStats(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.insightOps.getVpnTunnelStats(siteId, customHeaders);
    }

    public async getIpsecVpnStats(siteId?: string, customHeaders?: CustomHeaders): Promise<unknown> {
        return await this.insightOps.getIpsecVpnStats(siteId, customHeaders);
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
