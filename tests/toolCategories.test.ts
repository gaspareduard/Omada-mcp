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

    it('all alias expands to every non-future category', () => {
        const { categories } = parseToolCategories('all:r');
        const expectedCount = ALL_CATEGORIES.filter((c) => !FUTURE_CATEGORIES.has(c)).length;
        expect(categories.size).toBe(expectedCount);
    });

    it('all:rw gives read+write to every non-future category', () => {
        const { categories } = parseToolCategories('all:rw');
        for (const cat of ALL_CATEGORIES) {
            if (FUTURE_CATEGORIES.has(cat)) {
                expect(categories.has(cat)).toBe(false);
            } else {
                expect(categories.get(cat)).toEqual(new Set(['read', 'write']));
            }
        }
    });

    it('all (no suffix) gives read+write to every non-future category', () => {
        const { categories } = parseToolCategories('all');
        for (const cat of ALL_CATEGORIES) {
            if (!FUTURE_CATEGORIES.has(cat)) {
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

    it('registers only tools matching active categories and permissions', () => {
        const { categories: activeCategories } = parseToolCategories('dashboard:r');
        registerAllTools(mockServer, mockClient, activeCategories);

        expect((mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(0);
        // dashboard read tools are a subset of the full registry
        expect((mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls.length).toBeLessThan(351);
    });

    it('registers all 351 tools when no activeCategories provided', () => {
        registerAllTools(mockServer, mockClient);
        expect(mockServer.registerTool).toHaveBeenCalledTimes(351);
    });

    it('registers zero tools when active categories map is empty', () => {
        registerAllTools(mockServer, mockClient, new Map());
        expect(mockServer.registerTool).not.toHaveBeenCalled();
    });

    it('registers all tools when all:rw is active', () => {
        const { categories: activeCategories } = parseToolCategories('all:rw');
        registerAllTools(mockServer, mockClient, activeCategories);
        expect(mockServer.registerTool).toHaveBeenCalledTimes(351);
    });

    it('write-only filter registers only write tools for clients category', () => {
        // clients:w registers the rate-limit tools plus block/unblock/reconnect.
        const { categories: activeCategories } = parseToolCategories('clients:w');
        registerAllTools(mockServer, mockClient, activeCategories);
        expect((mockServer.registerTool as ReturnType<typeof vi.fn>).mock.calls.length).toBe(6);
    });

    it('logs active categories and tool count on startup', () => {
        const { categories: activeCategories } = parseToolCategories('dashboard:r');
        registerAllTools(mockServer, mockClient, activeCategories);
        expect(loggerModule.logger.info).toHaveBeenCalledWith('Tool categories loaded', expect.objectContaining({ toolCount: expect.any(Number) }));
    });
});
