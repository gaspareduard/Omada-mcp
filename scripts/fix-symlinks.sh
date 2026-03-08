#!/usr/bin/env bash
# Recreate AI instruction symlinks pointing to CLAUDE.md.
# Run this if the symlinks are ever lost:  npm run symlinks:fix

set -e
cd "$(git rev-parse --show-toplevel)"

echo "Creating AI instruction symlinks → CLAUDE.md"

[ -L AGENTS.md ] && rm AGENTS.md
ln -s CLAUDE.md AGENTS.md
echo "  ✅ AGENTS.md -> CLAUDE.md"

[ -L .github/copilot-instructions.md ] && rm .github/copilot-instructions.md
ln -s ../CLAUDE.md .github/copilot-instructions.md
echo "  ✅ .github/copilot-instructions.md -> ../CLAUDE.md"

[ -L .github/AGENTS.md ] && rm .github/AGENTS.md
ln -s ../CLAUDE.md .github/AGENTS.md
echo "  ✅ .github/AGENTS.md -> ../CLAUDE.md"

echo ""
echo "Done. Run 'git add AGENTS.md .github/copilot-instructions.md .github/AGENTS.md' if needed."
