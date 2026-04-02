# 0003 No Generic Raw API Tool

Date: 2026-04-02

The supported runtime will not expose a generic raw Omada API executor.

Reason:

- it defeats least privilege
- it makes review, testing, and documentation weaker
- it turns the MCP server into a privileged proxy rather than a curated platform
