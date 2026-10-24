# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 0.x (latest) | Yes |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use GitHub's private vulnerability reporting:

1. Go to the [Security tab](https://github.com/gaspareduard/Omada-mcp/security) of this repository.
2. Click **"Report a vulnerability"**.
3. Describe the issue, steps to reproduce, and potential impact.

You will receive an acknowledgement within **72 hours** and a resolution timeline within **7 days**.

## Scope

**In scope:**
- Credential exposure or leakage through MCP tool responses, logs, or error messages
- Capability profile bypass (accessing tools outside the configured profile)
- Authentication weaknesses in the OAuth2 client credentials flow
- DNS rebinding or origin validation bypasses in HTTP transport mode
- Container image vulnerabilities in the published Docker image
- Dependency vulnerabilities with a known exploit path

**Out of scope:**
- Vulnerabilities in the TP-Link Omada controller itself
- Issues requiring physical access to the network
- Social engineering attacks
- Issues in the HTTP transport that require `MCP_UNSAFE_ENABLE_HTTP=true` — HTTP mode is explicitly documented as unsafe and lab-only

## Security Design

This server is designed with a defense-in-depth approach:

- **stdio-first**: The production baseline uses stdio, which does not expose any network surface.
- **Credentials via environment only**: No credentials are accepted as tool arguments.
- **Capability gating**: Tools are segmented into categories (e.g., `clients`, `firewall-acl`) with read/write permission levels. The default profile (`safe-read`) exposes only read-only tools.
- **No secrets in logs**: Credential values are masked before logging.
- **Loopback-only HTTP**: When HTTP mode is explicitly enabled, the server binds to loopback addresses only.

See [docs/security-model.md](./docs/security-model.md) for the full security design.

## 0.19 release-candidate dependency limitation

The compatible dependency update clears the previously reported critical runtime advisories, but `zod@3.25.76` remains affected according to [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): oversized collections can exhaust memory during validation. The advisory's first patched version is 4.6.6; no Zod 3 patch was available during this review. A Zod 4 migration needs schema/SDK regression testing and is not represented as fixed by this candidate.

Use trusted local stdio clients and keep HTTP restricted to isolated lab use. These boundaries reduce exposure but do not eliminate resource-exhaustion risk from oversized local requests or controller responses. Re-run `npm audit --omit=dev` before promotion and track the schema migration as an unresolved gate.

The full development audit also reports four high-severity entries through the optional MCP Inspector dependency tree (five high entries including Zod). Inspector is a development-only tool, excluded from production installs. Its major-version upgrade is separate from the compatible runtime update. Both audits contain zero critical entries at this validation point.
