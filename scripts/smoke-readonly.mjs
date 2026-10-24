#!/usr/bin/env node
/** Candidate smoke check: GETs and explicit tool previews only; OAuth token POST is the sole permitted POST. */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { loadConfigFromEnv, parseToolCategories } from '../dist/config.js';
import { OmadaClient } from '../dist/omadaClient/index.js';
import { createServer } from '../dist/server/common.js';
import { registerAllTools } from '../dist/tools/index.js';

const config = loadConfigFromEnv();
const controller = new OmadaClient(config);
const requests = { reads: 0, tokenRequests: 0, blockedMutations: 0 };
// Deliberately guard the actual transport as well as the selected tool arguments.
controller.http.interceptors.request.use((request) => {
    const method = (request.method ?? 'get').toLowerCase();
    if (method === 'post' && request.url === '/openapi/authorize/token') requests.tokenRequests += 1;
    else if (method === 'get' || method === 'head') requests.reads += 1;
    else {
        requests.blockedMutations += 1;
        throw new Error('Read-only smoke check blocked a mutation');
    }
    return request;
});
const server = createServer();
registerAllTools(server, controller, parseToolCategories('all:rw').categories);
const client = new Client({ name: 'candidate-readonly-smoke', version: '1.0.0' });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await server.connect(serverTransport);
await client.connect(clientTransport);
const results = [];
function scrub(value) {
    let text = String(value);
    for (const secret of [config.clientSecret, config.clientId, config.omadacId, config.baseUrl])
        if (secret) text = text.replaceAll(secret, '[redacted]');
    return text.slice(0, 300);
}
async function read(name, fn) {
    try {
        const data = await fn();
        results.push({ check: name, status: 'ok', ...(Array.isArray(data) ? { records: data.length } : {}) });
        return data;
    } catch (error) {
        results.push({ check: name, status: 'unavailable', reason: scrub(error.message) });
        return undefined;
    }
}
async function tool(name, args = {}) {
    const result = await client.callTool({ name, arguments: args });
    if (result.isError) throw new Error(result.content?.find((item) => item.type === 'text')?.text ?? 'Tool failed');
    return result.structuredContent ?? JSON.parse(result.content[0].text);
}
try {
    await read('capability-discovery', () => tool('getServerCapabilities'));
    const siteId = await read('site-discovery', () => controller.resolveSiteId());
    if (siteId) {
        const devices = await read('complete-device-inventory', () => controller.listDevices(siteId));
        const clients = await read('complete-online-client-inventory', () => controller.listClients(siteId));
        for (const name of ['getWifiHealthSummary', 'diagnoseLogs']) {
            const data = await read(name, () => tool(name, { siteId }));
            if (data)
                results[results.length - 1].evidence = {
                    complete: data.complete,
                    missing: data.missing,
                    sections: Object.fromEntries(Object.entries(data.sections ?? {}).map(([key, value]) => [key, value.status])),
                };
        }
        const deviceList = Array.isArray(devices) ? devices : [];
        const ap = deviceList.find((device) => device.type === 'ap');
        const sw = deviceList.find((device) => device.type === 'switch');
        if (ap?.mac) {
            const radios = await read('AP-radio-read', () => controller.getRadiosConfig(ap.mac, siteId));
            const band = [
                ['radioSetting2g', '2.4GHz'],
                ['radioSetting5g', '5GHz'],
                ['radioSetting5g1', '5GHz-1'],
                ['radioSetting6g', '6GHz'],
            ].find(([key]) => typeof radios?.[key]?.radioEnable === 'boolean');
            if (band)
                await read('AP-radio-preview', () =>
                    tool('setApRadio', { apMac: ap.mac, siteId, band: band[1], radioEnable: radios[band[0]].radioEnable, dryRun: true })
                );
        } else results.push({ check: 'AP-radio-preview', status: 'skipped', reason: 'No AP identity in the selected inventory' });
        if (sw?.mac) {
            const detail = await read('switch-detail-read', () => controller.getSwitchDetail(sw.mac, siteId));
            const port = detail?.portList?.find((item) => Number.isInteger(item.port) && typeof item.name === 'string' && item.name.trim());
            if (port)
                await read('switch-port-preview', () =>
                    tool('setSwitchPorts', {
                        switchMac: sw.mac,
                        siteId,
                        ports: [port.port],
                        change: { operation: 'name', name: port.name },
                        dryRun: true,
                    })
                );
        } else results.push({ check: 'switch-port-preview', status: 'skipped', reason: 'No switch identity in the selected inventory' });
        const candidate = Array.isArray(clients) ? clients.find((item) => typeof item.mac === 'string') : undefined;
        if (candidate) await read('client-connectivity-composition', () => tool('diagnoseCameraConnectivity', { siteId, identifier: candidate.mac }));
    }
} finally {
    await client.close();
    await server.close();
}
console.log(
    JSON.stringify({ version: '0.19.0-rc.1', observedAt: new Date().toISOString(), strictSsl: config.strictSsl, requests, results }, null, 2)
);
