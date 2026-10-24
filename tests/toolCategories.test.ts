import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ALL_CATEGORIES, CATEGORY_GROUP_ALIASES, DEFAULT_TOOL_CATEGORIES, FUTURE_CATEGORIES, parseToolCategories } from '../src/config.js';
import type { OmadaClient } from '../src/omadaClient/index.js';
import { registerAllTools } from '../src/tools/index.js';
import * as loggerModule from '../src/utils/logger.js';

describe('parseToolCategories', () => {
    beforeEach(() => {
        vi.spyOn(loggerModule.logger, 'warn').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // -----------------------------------------------------------------------
    // Default value
    // -----------------------------------------------------------------------

    it('parses the default OMADA_TOOL_CATEGORIES without error', () => {
        const { categories } = parseToolCategories(DEFAULT_TOOL_CATEGORIES);
        expect(categories.size).toBeGreaterThan(0);
    });

    it('default includes dashboard, client-insights, clients with only read', () => {
        const { categories } = parseToolCategories(DEFAULT_TOOL_CATEGORIES);
        expect(categories.get('dashboard')).toEqual(new Set(['read']));
        expect(categories.get('client-insights')).toEqual(new Set(['read']));
        expect(categories.get('clients')).toEqual(new Set(['read']));
    });

    it('default does not include insights (future category)', () => {
        const { categories } = parseToolCategories(DEFAULT_TOOL_CATEGORIES);
        expect(categories.has('insights')).toBe(false);
    });

    it('default expands devices-all:r to all four device categories with read', () => {
        const { categories } = parseToolCategories(DEFAULT_TOOL_CATEGORIES);
        for (const cat of CATEGORY_GROUP_ALIASES['devices-all']) {
            expect(categories.get(cat)).toEqual(new Set(['read']));
        }
    });

    // -----------------------------------------------------------------------
    // Suffix parsing
    // -----------------------------------------------------------------------

    it(':r suffix produces read-only permission', () => {
        const { categories } = parseToolCategories('clients:r');
        expect(categories.get('clients')).toEqual(new Set(['read']));
    });

    it(':w suffix produces write-only permission', () => {
        const { categories } = parseToolCategories('clients:w');
        expect(categories.get('clients')).toEqual(new Set(['write']));
    });

    it(':rw suffix produces read and write permissions', () => {
        const { categories } = parseToolCategories('clients:rw');
        expect(categories.get('clients')).toEqual(new Set(['read', 'write']));
    });

    it('no suffix defaults to read+write', () => {
        const { categories } = parseToolCategories('clients');
        expect(categories.get('clients')).toEqual(new Set(['read', 'write']));
    });

    // -----------------------------------------------------------------------
    // Multiple categories
    // -----------------------------------------------------------------------

    it('parses multiple comma-separated categories', () => {
        const { categories } = parseToolCategories('dashboard:r,clients:w,vpn:rw');
        expect(categories.get('dashboard')).toEqual(new Set(['read']));
        expect(categories.get('clients')).toEqual(new Set(['write']));
        expect(categories.get('vpn')).toEqual(new Set(['read', 'write']));
    });

    it('handles extra whitespace around tokens', () => {
        const { categories } = parseToolCategories(' dashboard:r , clients:r ');
        expect(categories.get('dashboard')).toEqual(new Set(['read']));
        expect(categories.get('clients')).toEqual(new Set(['read']));
    });

    // -----------------------------------------------------------------------
    // Permission merging (same category listed twice with different perms)
    // -----------------------------------------------------------------------

    it('merges permissions when the same category appears twice', () => {
        const { categories } = parseToolCategories('clients:r,clients:w');
        expect(categories.get('clients')).toEqual(new Set(['read', 'write']));
    });

    // -----------------------------------------------------------------------
    // Group alias: all
    // -----------------------------------------------------------------------

    it('all alias expands to implemented categories except recovery', () => {
        const { categories } = parseToolCategories('all:r');
        const expectedCount = ALL_CATEGORIES.filter((c) => !FUTURE_CATEGORIES.has(c) && c !== 'recovery').length;
        expect(categories.size).toBe(expectedCount);
    });

    it('all:rw grants read+write to implemented categories except recovery', () => {
        const { categories } = parseToolCategories('all:rw');
        for (const cat of ALL_CATEGORIES) {
            if (FUTURE_CATEGORIES.has(cat) || cat === 'recovery') {
                expect(categories.has(cat)).toBe(false);
            } else {
                expect(categories.get(cat)).toEqual(new Set(['read', 'write']));
            }
        }
    });

    it('all without suffix still excludes recovery', () => {
        const { categories } = parseToolCategories('all');
        for (const cat of ALL_CATEGORIES) {
            if (FUTURE_CATEGORIES.has(cat) || cat === 'recovery') {
                expect(categories.has(cat)).toBe(false);
            } else {
                expect(categories.get(cat)).toEqual(new Set(['read', 'write']));
            }
        }
    });

    // -----------------------------------------------------------------------
    // Group alias expansions
    // -----------------------------------------------------------------------

    it('devices-all expands to the four device categories', () => {
        const { categories } = parseToolCategories('devices-all:r');
        const expected = CATEGORY_GROUP_ALIASES['devices-all'];
        expect(categories.size).toBe(expected.length);
        for (const cat of expected) {
            expect(categories.get(cat)).toEqual(new Set(['read']));
        }
    });

    it('wireless-all expands correctly', () => {
        const { categories } = parseToolCategories('wireless-all:r');
        const expected = CATEGORY_GROUP_ALIASES['wireless-all'];
        for (const cat of expected) {
            expect(categories.get(cat)).toEqual(new Set(['read']));
        }
    });

    it('network-all expands correctly (skips future network-sim-lte)', () => {
        const { categories, warnings } = parseToolCategories('network-all:r');
        const expected = CATEGORY_GROUP_ALIASES['network-all'];
        for (const cat of expected) {
            if (FUTURE_CATEGORIES.has(cat)) {
                expect(categories.has(cat)).toBe(false);
                expect(warnings.some((w) => w.includes(cat))).toBe(true);
            } else {
                expect(categories.get(cat)).toEqual(new Set(['read']));
            }
        }
    });

    it('firewall-all expands correctly', () => {
        const { categories } = parseToolCategories('firewall-all:r');
        const expected = CATEGORY_GROUP_ALIASES['firewall-all'];
        for (const cat of expected) {
            expect(categories.get(cat)).toEqual(new Set(['read']));
        }
    });

    it('security-all expands correctly', () => {
        const { categories } = parseToolCategories('security-all:r');
        const expected = CATEGORY_GROUP_ALIASES['security-all'];
        for (const cat of expected) {
            expect(categories.get(cat)).toEqual(new Set(['read']));
        }
    });

    it('hotspot-all is no longer a recognized alias and generates an unknown category warning', () => {
        const { categories, warnings } = parseToolCategories('hotspot-all:r');
        expect(categories.size).toBe(0);
        expect(warnings.some((w) => w.includes('hotspot-all'))).toBe(true);
    });

    it('account-all is no longer a recognized alias and generates an unknown category warning', () => {
        const { categories, warnings } = parseToolCategories('account-all:r');
        expect(categories.size).toBe(0);
        expect(warnings.some((w) => w.includes('account-all'))).toBe(true);
    });

    // -----------------------------------------------------------------------
    // Suffix inheritance through aliases
    // -----------------------------------------------------------------------

    it('alias suffix :r propagates read-only to all expanded categories', () => {
        const { categories } = parseToolCategories('devices-all:r');
        for (const cat of CATEGORY_GROUP_ALIASES['devices-all']) {
            const perms = categories.get(cat);
            expect(perms?.has('read')).toBe(true);
            expect(perms?.has('write')).toBe(false);
        }
    });

    it('alias suffix :w propagates write-only to all expanded categories', () => {
        const { categories } = parseToolCategories('wireless-all:w');
        for (const cat of CATEGORY_GROUP_ALIASES['wireless-all']) {
            const perms = categories.get(cat);
            expect(perms?.has('write')).toBe(true);
            expect(perms?.has('read')).toBe(false);
        }
    });

    it('alias with no suffix propagates read+write to all expanded non-future categories', () => {
        const { categories } = parseToolCategories('network-all');
        for (const cat of CATEGORY_GROUP_ALIASES['network-all']) {
            if (!FUTURE_CATEGORIES.has(cat)) {
                expect(categories.get(cat)).toEqual(new Set(['read', 'write']));
            }
        }
    });

    // -----------------------------------------------------------------------
    // Invalid category names
    // -----------------------------------------------------------------------

    it('warns (via warnings array) and skips unknown category names', () => {
        const { categories, warnings } = parseToolCategories('totally-fake-cat:r');
        expect(warnings.some((w) => w.includes('unknown category "totally-fake-cat"'))).toBe(true);
        expect(loggerModule.logger.warn).not.toHaveBeenCalled();
        expect(categories.size).toBe(0);
    });

    it('skips invalid categories but still parses valid ones', () => {
        const { categories, warnings } = parseToolCategories('dashboard:r,invalid-cat:r,clients:r');
        expect(categories.get('dashboard')).toEqual(new Set(['read']));
        expect(categories.get('clients')).toEqual(new Set(['read']));
        expect(categories.has('invalid-cat' as never)).toBe(false);
        expect(warnings.some((w) => w.includes('unknown category "invalid-cat"'))).toBe(true);
        expect(loggerModule.logger.warn).not.toHaveBeenCalled();
    });

    it('returns empty categories for empty string', () => {
        const { categories } = parseToolCategories('');
        expect(categories.size).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// Category filtering in registerAllTools
// ---------------------------------------------------------------------------

describe('registerAllTools category filtering', () => {
    let mockServer: McpServer;
    let mockClient: OmadaClient;

    beforeEach(() => {
        mockServer = {
            registerTool: vi.fn(),
        } as unknown as McpServer;
        mockClient = {} as OmadaClient;
        vi.spyOn(loggerModule.logger, 'info').mockImplementation(() => {
            // Mock implementation
        });
        vi.spyOn(loggerModule.logger, 'warn').mockImplementation(() => {
            // Mock implementation
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const discoveryNames = ['searchOperations', 'describeOperation', 'getServerCapabilities'];
    const restoreNames = ['restoreController', 'restoreControllerFromFileServer', 'restoreSites', 'restoreSitesFromFileServer'];
    const dashboardNames = [
        'getNetworkHealthSummary',
        'getDashboardWifiSummary',
        'getDashboardSwitchSummary',
        'getDashboardTrafficActivities',
        'getDashboardPoEUsage',
        'getDashboardTopCpuUsage',
        'getDashboardTopMemoryUsage',
        'getDashboardMostActiveSwitches',
        'getDashboardMostActiveEaps',
        'getDashboardOverview',
        'getTrafficDistribution',
        'getIspLoad',
    ];
    const fullOperationCount = 372;
    const deprecatedOperationCount = 28;

    function names(): string[] {
        return vi.mocked(mockServer.registerTool).mock.calls.map(([name]) => name);
    }

    it('registers exactly the active dashboard operations and discovery tools', () => {
        registerAllTools(mockServer, mockClient, parseToolCategories('dashboard:r').categories);
        expect(names().sort()).toEqual([...dashboardNames, ...discoveryNames].sort());
        for (const [, definition] of vi.mocked(mockServer.registerTool).mock.calls) {
            expect(definition.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
        }
    });

    it('omitted categories expose nondeprecated operations with recovery denied', () => {
        registerAllTools(mockServer, mockClient);
        expect(names()).toHaveLength(fullOperationCount - deprecatedOperationCount - restoreNames.length + discoveryNames.length);
        expect(names()).toEqual(expect.arrayContaining(discoveryNames));
        expect(names().filter((name) => restoreNames.includes(name))).toEqual([]);
        for (const [, definition] of vi.mocked(mockServer.registerTool).mock.calls) {
            expect(definition.description).not.toMatch(/^\[DEPRECATED\]/);
        }
    });

    it('registers exactly the discovery tools when categories are empty', () => {
        registerAllTools(mockServer, mockClient, new Map());
        expect(names().sort()).toEqual([...discoveryNames].sort());
    });

    it('all:rw excludes recovery even when deprecated tools are requested', () => {
        registerAllTools(mockServer, mockClient, parseToolCategories('all:rw').categories, { includeDeprecated: true });
        expect(names()).toHaveLength(fullOperationCount - restoreNames.length + discoveryNames.length);
        expect(names().filter((name) => restoreNames.includes(name))).toEqual([]);
        expect(names()).toContain('getRFScanResult');
    });

    it('registers 372 operations plus three discovery tools with explicit recovery and aliases', () => {
        registerAllTools(mockServer, mockClient, parseToolCategories('all:rw,recovery:rw').categories, { includeDeprecated: true });
        expect(names()).toHaveLength(fullOperationCount + discoveryNames.length);
        expect(new Set(names()).size).toBe(fullOperationCount + discoveryNames.length);
        expect(names()).toEqual(
            expect.arrayContaining([...restoreNames, ...discoveryNames, 'getRFScanResult', 'setApRadio', 'updateSsid', 'setSwitchPorts'])
        );
        expect(names()).not.toContain('callOperation');
        expect(
            vi.mocked(mockServer.registerTool).mock.calls.filter(([, definition]) => definition.description?.startsWith('[DEPRECATED]'))
        ).toHaveLength(deprecatedOperationCount);
    });

    it('has 376 distinct tool names across the standard and compact interfaces', () => {
        const categories = parseToolCategories('all:rw,recovery:rw').categories;
        registerAllTools(mockServer, mockClient, categories, { includeDeprecated: true });
        const standardNames = names();
        vi.mocked(mockServer.registerTool).mockClear();
        registerAllTools(mockServer, mockClient, categories, { includeDeprecated: true, catalogMode: 'compact' });
        expect(names().sort()).toEqual([...discoveryNames, 'callOperation'].sort());
        expect(new Set([...standardNames, ...names()]).size).toBe(376);
    });

    it('write-only clients expose six mutations and the three discovery tools', () => {
        registerAllTools(mockServer, mockClient, parseToolCategories('clients:w').categories);
        const mutations = [
            'blockClient',
            'unblockClient',
            'reconnectClient',
            'setClientRateLimit',
            'setClientRateLimitProfile',
            'disableClientRateLimit',
        ];
        expect(names().sort()).toEqual([...mutations, ...discoveryNames].sort());
        for (const [name, definition] of vi.mocked(mockServer.registerTool).mock.calls) {
            expect(definition.annotations).toMatchObject({ readOnlyHint: discoveryNames.includes(name), destructiveHint: mutations.includes(name) });
        }
    });

    it('logs registered operation count separately from the discovery interface', () => {
        registerAllTools(mockServer, mockClient, parseToolCategories('dashboard:r').categories);
        expect(loggerModule.logger.info).toHaveBeenCalledWith('Tool categories loaded', {
            registeredOperations: dashboardNames.length,
            catalogMode: 'standard',
        });
    });
});
