/**
 * Client past connection information from the Omada API.
 * Represents historical client connection data.
 */
export interface ClientPastConnection {
    /** Client History ID */
    id?: string;

    /** Client MAC Address */
    mac?: string;

    /** Downstream traffic (bytes) */
    download?: number;

    /** Upstream traffic (bytes) */
    upload?: number;

    /** Up time (seconds) */
    duration?: number;

    /** The timestamp (ms) when the client connected */
    firstSeen?: number;

    /** Last found time, timestamp (ms) */
    lastSeen?: number;

    /** Client Name */
    name?: string;

    /** (Wireless) SSID name */
    ssid?: string;

    /** (Wired) Port ID */
    port?: number;

    /** (Wireless) Whether it is Guest (used to display the wireless Guest client icon) */
    guest?: boolean;

    /** Device name */
    deviceName?: string;

    /** (Wireless) The time (ms) it takes for the client to connect to SSID */
    associationTime?: number;

    /** IP Address */
    ip?: string;

    /** IPv6 Addresses */
    ipv6List?: string[];

    /** Client portal authentication information */
    authInfo?: unknown[]; // AuthInfoOpenApiVO structure not fully specified
}

/**
 * Options for listing client past connections.
 */
export interface ListClientsPastConnectionsOptions {
    /** Optional site ID. If not provided, uses the default site from configuration */
    siteId?: string;

    /** Start page number. Start from 1 */
    page: number;

    /** Number of entries per page. It should be within the range of 1–1000 */
    pageSize: number;

    /** Sort parameter may be one of asc or desc. When there are more than one, the first one takes effect */
    sortLastSeen?: 'asc' | 'desc';

    /** Filter query parameters, support field time range: start timestamp (ms) */
    timeStart?: number;

    /** Filter query parameters, support field time range: end timestamp (ms) */
    timeEnd?: number;

    /** Filter query parameters, support field guest: true/false */
    guest?: boolean;

    /** Fuzzy query parameters, support field name,mac,ssid */
    searchKey?: string;
}
