#!/bin/bash
# Hook: Block unsafe 'claude mcp add' commands that would expose API keys
# Installed by: no-more-leaked-keys skill

# This hook is triggered by Claude Code's PreToolUse event
# It checks if the command contains 'claude mcp add' with auth headers

INPUT=$(cat)

# Check if this is a Bash command containing unsafe mcp add
if echo "$INPUT" | grep -q "claude mcp add" && echo "$INPUT" | grep -qi "header.*authorization\|header.*bearer"; then
    echo '{"decision": "block", "message": "BLOCKED: claude mcp add with auth headers exposes your API key in terminal output!\n\nUse /secrets or /add-mcp instead - these pull keys from Keychain securely without exposing them.\n\nSee: https://github.com/Vibe-Marketer/no-more-leaked-keys"}'
    exit 0
fi

# Allow all other commands
echo '{"decision": "allow"}'
