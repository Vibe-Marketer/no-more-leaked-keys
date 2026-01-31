---
description: Securely add an MCP server without exposing API keys
allowed-tools: ["Skill", "Bash", "Read", "Write", "Edit"]
---

Invoke the keychain-secrets skill to securely add an MCP server.

**NEVER use `claude mcp add` with authentication headers - it exposes keys in terminal output!**

This command will:
1. Verify the API key exists in Keychain
2. Add the MCP config by directly editing the config file
3. Never echo or display the key

Arguments: $ARGUMENTS

Use workflow: add-mcp.md
