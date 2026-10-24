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
] as const;

/**
 * Strings this length or shorter are masked in full. Above this length we reveal
 * a 4-char prefix/suffix to aid debugging. The bound is deliberately generous so
 * that short secrets, PINs, and client IDs are never partially disclosed.
 */
const MASK_FULL_THRESHOLD = 12;

/**
 * Check if a key name indicates sensitive data.
 */
export function isSensitiveKey(key: string): boolean {
    const normalized = key.toLowerCase();
    return SENSITIVE_KEY_SUBSTRINGS.some((substring) => normalized.includes(substring));
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
        if (value.length <= MASK_FULL_THRESHOLD) {
            return '********';
        }
        return `${value.slice(0, 4)}…${value.slice(-4)}`;
    }

    if (Array.isArray(value)) {
        return value.map(() => '********');
    }

    if (typeof value === 'object' && value !== null) {
        return '[masked-object]';
    }

    return '********';
}
