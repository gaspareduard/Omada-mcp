/**
 * Active client information from dashboard.
 */
export interface ActiveClientInfo {
    /** Client name */
    name: string;
    /** Whether the client is wireless */
    wireless: boolean;
    /** Client device type */
    type: string;
    /** Client device model */
    model: string;
    /** Client MAC address */
    mac: string;
    /** Total traffic in bytes */
    totalTraffic: number;
}
