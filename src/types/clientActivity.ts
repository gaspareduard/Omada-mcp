/**
 * Client activity information from dashboard.
 * Contains statistics about new, active, and disconnected clients over time.
 */
export interface ClientActivity {
    /** Number of new wireless (EAP) clients */
    newEapClientNum: number;
    /** Number of new wired (switch) clients */
    newSwitchClientNum: number;
    /** Number of active wireless (EAP) clients */
    activeEapClientNum: number;
    /** Number of active wired (switch) clients */
    activeSwitchClientNum: number;
    /** Number of disconnected wireless (EAP) clients */
    disconnectEapClientNum: number;
    /** Number of disconnected wired (switch) clients */
    disconnectSwitchClientNum: number;
    /** Timestamp for this activity snapshot (Unix timestamp in seconds) */
    time: number;
}

/**
 * Options for retrieving client activity.
 */
export interface GetClientActivityOptions {
    /** Optional site ID, uses default from config if not provided */
    siteId?: string;
    /** Optional start timestamp in seconds (e.g., 1682000000) */
    start?: number;
    /** Optional end timestamp in seconds (e.g., 1682000000) */
    end?: number;
}
