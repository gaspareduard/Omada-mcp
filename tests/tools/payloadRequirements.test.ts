import { describe, expect, it } from 'vitest';

import {
    ddnsPayloadSchema,
    lanDnsPayloadSchema,
    lanProfileUpdatePayloadSchema,
    normalizeDdnsRecord,
    ssidPayloadSchema,
    voucherGroupPayloadSchema,
} from '../../src/tools/payloadRequirements.js';

const ddns = { service: 1, status: false, interfacePortId: 'wan-1', username: 'u', password: 'p', domainName: 'host.example.com' };

describe('tools/payloadRequirements', () => {
    it('requires exactly one DDNS interval', () => {
        expect(ddnsPayloadSchema.safeParse(ddns).success).toBe(false);
        expect(ddnsPayloadSchema.safeParse({ ...ddns, interval: { updateInterval: 6, customInterval: 5 } }).success).toBe(false);
        expect(ddnsPayloadSchema.safeParse({ ...ddns, interval: { updateInterval: 6 } }).success).toBe(true);
        expect(ddnsPayloadSchema.safeParse({ ...ddns, interval: { customInterval: 5 } }).success).toBe(true);
    });

    it('rebuilds the DDNS interval object from flattened reads', () => {
        expect(normalizeDdnsRecord({ id: 'd', updateInterval: 0, existCustomInterval: false })).toMatchObject({ interval: { updateInterval: 0 } });
        expect(normalizeDdnsRecord({ id: 'd', customInterval: 5, existCustomInterval: true })).toMatchObject({ interval: { customInterval: 5 } });
    });

    it('requires LAN DNS rules to name at least one network', () => {
        const rule = { enable: false, name: 'n', domain: 'host.example', type: 0, ipAddresses: ['192.0.2.1'] };
        expect(lanDnsPayloadSchema.safeParse(rule).success).toBe(false);
        expect(lanDnsPayloadSchema.safeParse({ ...rule, lanNetworkIds: [] }).success).toBe(false);
        expect(lanDnsPayloadSchema.safeParse({ ...rule, lanNetworkIds: ['net-1'] }).success).toBe(true);
    });

    it('requires untagNetworkIds on LAN profile updates', () => {
        const profile = {
            name: 'p',
            poe: 2,
            nativeNetworkId: 'net-1',
            dot1x: 2,
            portIsolationEnable: false,
            lldpMedEnable: true,
            bandWidthCtrlType: 0,
            spanningTreeEnable: false,
            loopbackDetectEnable: false,
        };
        expect(lanProfileUpdatePayloadSchema.safeParse(profile).success).toBe(false);
        expect(lanProfileUpdatePayloadSchema.safeParse({ ...profile, untagNetworkIds: [] }).success).toBe(true);
    });

    it('requires a VLAN ID for VLAN-mapped SSIDs and a key for WPA-Personal', () => {
        const ssid = {
            name: 's',
            deviceType: 1,
            band: 1,
            guestNetEnable: false,
            security: 0,
            broadcast: false,
            vlanEnable: false,
            mloEnable: false,
            pmfMode: 3,
            enable11r: false,
            hidePwd: false,
        };
        expect(ssidPayloadSchema.safeParse(ssid).success).toBe(true);
        expect(ssidPayloadSchema.safeParse({ ...ssid, vlanEnable: true }).success).toBe(false);
        expect(ssidPayloadSchema.safeParse({ ...ssid, vlanEnable: true, vlanId: 50 }).success).toBe(true);
        expect(ssidPayloadSchema.safeParse({ ...ssid, security: 3 }).success).toBe(false);
        const psk = { securityKey: 'not-a-real-key', versionPsk: 2, encryptionPsk: 3, gikRekeyPskEnable: false };
        expect(ssidPayloadSchema.safeParse({ ...ssid, security: 3, pskSetting: psk }).success).toBe(true);
    });

    it('requires the rate limit source that matches rateLimit.mode', () => {
        const group = {
            name: 'v',
            amount: 1,
            codeLength: 6,
            codeForm: [0],
            limitType: 0,
            durationType: 0,
            duration: 60,
            timingType: 0,
            trafficLimitEnable: false,
            applyToAllPortals: true,
        };
        expect(voucherGroupPayloadSchema.safeParse({ ...group, rateLimit: { mode: 0 } }).success).toBe(false);
        expect(voucherGroupPayloadSchema.safeParse({ ...group, rateLimit: { mode: 1 } }).success).toBe(false);
        expect(voucherGroupPayloadSchema.safeParse({ ...group, rateLimit: { mode: 1, rateLimitProfileId: 'p' } }).success).toBe(true);
        const custom = { downLimitEnable: false, upLimitEnable: false };
        expect(voucherGroupPayloadSchema.safeParse({ ...group, rateLimit: { mode: 0, customRateLimit: custom } }).success).toBe(true);
    });
});
