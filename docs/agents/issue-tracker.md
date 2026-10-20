# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `gaspareduard/Omada-mcp`.
Use the `gh` CLI with `--repo gaspareduard/Omada-mcp` explicitly:
this clone also has an upstream remote.

## Conventions

- Create: `gh issue create --repo gaspareduard/Omada-mcp --title "..." --body-file <file>`.
- Read: `gh issue view <number> --repo gaspareduard/Omada-mcp --json number,title,body,labels,comments`.
- List: `gh issue list --repo gaspareduard/Omada-mcp --state open --json number,title,body,labels`.
  Add label and state filters as needed.
- Comment: `gh issue comment <number> --repo gaspareduard/Omada-mcp --body-file <file>`.
- Apply or remove labels: `gh issue edit <number> --repo gaspareduard/Omada-mcp --add-label "..."` or `--remove-label "..."`.
- Close: `gh issue close <number> --repo gaspareduard/Omada-mcp`.
- For multiline bodies, write the exact text to a temporary file and pass `--body-file`.

When a skill says "publish to the issue tracker", create a GitHub issue.
When it says "fetch the relevant ticket", read the GitHub issue.

## Pull requests as a triage surface

**PRs as a request surface: no.**

GitHub shares issue and PR numbers. When the type is unclear, resolve it
with `gh pr view` and fall back to `gh issue view`.

## Wayfinding operations

- Map: one issue labelled `wayfinder:map`, containing Notes,
  Decisions-so-far, and Fog.
- Child tickets: link issues to the map using native GitHub sub-issues.
  If unavailable, use a task list in the map and `Part of #<map>` in each child.
  Use `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`,
  or `wayfinder:task` as appropriate.
- Blocking: use native GitHub issue dependencies. API dependency writes
  require the blocker's numeric database ID, not its issue number.
  If dependencies are unavailable, record `Blocked by: #<number>` in the child.
- Frontier: choose the first open child in map order with no open blockers
  and no assignee.
- Claim: assign the ticket to the driving developer.
- Resolve: record the answer, close the ticket, and add a concise result
  and link to the map's Decisions-so-far.
