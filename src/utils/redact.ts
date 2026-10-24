/**
 * Centralized redaction helpers for logging.
 *
 * All log-sanitization layers (HTTP request handler, MCP server, HTTP transport)
 * MUST use these primitives so that a field masked in one layer is masked in all
 * of them. Previously each layer carried its own copy with subtly different rules,
 * which meant a value could be redacted in one place and leak in another.
 */

/** Substrings (case-insensitive) that mark a key name as sensitive. */
const SENSITIVE_KEY_SUBSTRINGS = [
    'authorization',
    'token',
    'secret',
    'password',
    'cookie',
    'clientid',
    'client-id',
    'client_id',
    'customheaders',
    'privatekey',
    'private_key',
    'presharedkey',
    'securitykey',
    'passphrase',
    'community',
] as const;

/**
 * Check if a key name indicates sensitive data.
 */
export function isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase();
    return /^(key|psk|pin)$/.test(normalized) || SENSITIVE_KEY_SUBSTRINGS.some((substring) => normalized.includes(substring));
}

/**
 * Heuristic for free-form strings that look like a credential/token even when the
 * surrounding key name gives no hint (e.g. a bare token in an array).
 */
export function isLikelySensitiveString(value: string): boolean {
    return value.length > 16 && /[A-Za-z0-9+/=._-]{16,}/.test(value);
}

/**
 * Mask a sensitive value for logging.
 */
export function maskValue(value: unknown): unknown {
    if (typeof value === 'string') {
        return '********';
    }

    if (Array.isArray(value)) {
        return value.map(() => '********');
    }

    if (typeof value === 'object' && value !== null) {
        return '[masked-object]';
    }

    return '********';
}

/** Redact named secrets in tool results without hiding ordinary identifiers. */
export function redactSecrets(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(redactSecrets);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, isSensitiveKey(key) ? maskValue(entry) : redactSecrets(entry)]));
}
