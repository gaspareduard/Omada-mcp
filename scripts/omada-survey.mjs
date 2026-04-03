import { OmadaClient } from '../dist/omadaClient/index.js';

const client = new OmadaClient({
    baseUrl: process.env.OMADA_BASE_URL,
    clientId: process.env.OMADA_CLIENT_ID,
    clientSecret: process.env.OMADA_CLIENT_SECRET,
    omadacId: process.env.OMADA_OMADAC_ID,
    strictSsl: process.env.OMADA_STRICT_SSL === 'true',
    requestTimeout: 15000,
});

const last7dStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
const now = Date.now();

function gatewayCandidate(dev) {
    const hay = [dev?.type, dev?.deviceType, dev?.category, dev?.subType, dev?.model, dev?.name].filter(Boolean).join(' ').toLowerCase();
    return hay.includes('gateway') || hay.includes('router') || hay.includes('er');
}

function summarizeDevices(devices) {
    const counts = {};
    for (const dev of devices) {
        const key = dev?.type || dev?.deviceType || dev?.category || dev?.model || 'unknown';
        counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
}

try {
    const sites = await client.listSites();
    const globalAlerts = await client
        .listGlobalAlerts({ page: 1, pageSize: 10, startTime: last7dStart, endTime: now })
        .catch((e) => ({ error: e.message }));
    const siteSummaries = [];

    for (const site of sites) {
        const siteId = site.siteId || site.id || site.site_id;
        const siteName = site.name || site.siteName || siteId;
        const [devices, clients, wlans, lans] = await Promise.all([
            client.getAllDeviceBySite(siteId).catch((e) => ({ error: e.message })),
            client.listClients(siteId).catch((e) => ({ error: e.message })),
            client.getWlanGroupList(siteId).catch((e) => ({ error: e.message })),
            client.getLanNetworkList(siteId).catch((e) => ({ error: e.message })),
        ]);

        const deviceArray = Array.isArray(devices) ? devices : [];
        const clientArray = Array.isArray(clients) ? clients : [];
        const wlanArray = Array.isArray(wlans) ? wlans : [];
        const lanArray = Array.isArray(lans) ? lans : [];
        const gateway = deviceArray.find(gatewayCandidate);
        const wanStatus = gateway?.mac ? await client.getGatewayWanStatus(gateway.mac, siteId).catch((e) => ({ error: e.message })) : null;
        const audit = await client
            .listSiteAuditLogs({ page: 1, pageSize: 10, startTime: last7dStart, endTime: now }, siteId)
            .catch((e) => ({ error: e.message }));

        siteSummaries.push({
            siteId,
            siteName,
            deviceCount: deviceArray.length,
            deviceTypes: summarizeDevices(deviceArray),
            clientCount: clientArray.length,
            onlineClients: clientArray.filter((c) => c?.status === 'connected' || c?.status === 'online' || c?.active === true).length,
            wlanGroupCount: wlanArray.length,
            wlanNames: wlanArray
                .slice(0, 10)
                .map((w) => w?.name || w?.ssidName || w?.ssid || w?.id)
                .filter(Boolean),
            lanCount: lanArray.length,
            lanNames: lanArray
                .slice(0, 10)
                .map((l) => l?.name || l?.networkName || l?.id)
                .filter(Boolean),
            gateway: gateway ? { name: gateway.name, model: gateway.model, mac: gateway.mac } : null,
            wanStatus,
            auditCountPage1: audit?.totalNum ?? audit?.data?.length ?? (Array.isArray(audit) ? audit.length : null),
            auditSample: audit?.data ? audit.data.slice(0, 3) : audit,
            errors: {
                devices: devices?.error || null,
                clients: clients?.error || null,
                wlans: wlans?.error || null,
                lans: lans?.error || null,
            },
        });
    }

    console.log(JSON.stringify({ sites, globalAlerts, siteSummaries }, null, 2));
} catch (error) {
    console.error(JSON.stringify({ error: error.message, stack: error.stack }, null, 2));
    process.exit(1);
}
