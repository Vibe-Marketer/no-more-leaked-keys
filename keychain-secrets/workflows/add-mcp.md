# Workflow: Add MCP Server Securely

<purpose>
Securely add an MCP server with authentication to Claude Code or OpenCode WITHOUT exposing the API key. This replaces the unsafe `claude mcp add` command which echoes secrets to the terminal.

**NEVER use `claude mcp add` with `--header "Authorization: Bearer ..."` - it will expose the key!**
</purpose>

<required_reading>
**Read these reference files NOW:**
1. references/keychain-commands.md
</required_reading>

<process>
## Step 1: Gather MCP Information

Ask the user for:
1. **MCP Name** - e.g., `tally`, `github`, `sentry`
2. **MCP URL** - e.g., `https://api.tally.so/mcp`
3. **Key Name in Keychain** - e.g., `TALLY_API_KEY` (must already be stored via add-key workflow)
4. **Target** - `claude` (Claude Code) or `opencode` or `both`

## Step 2: Verify Key Exists in Keychain

```bash
security find-generic-password -a "$USER" -s "KEY_NAME" -w >/dev/null 2>&1 && \
echo "[OK] KEY_NAME found in Keychain" || \
echo "[MISSING] KEY_NAME not in Keychain - add it first with the add-key workflow"
```

If missing, switch to `add-key.md` workflow first.

## Step 3: Add to Claude Code (~/.claude.json)

**CRITICAL: We directly edit the JSON file. We NEVER echo or print the key.**

Use this Python script to safely add the MCP without exposing the key:

```bash
python3 << 'PYTHON_SCRIPT'
import json
import subprocess
import os

# Configuration - REPLACE THESE
MCP_NAME = "MCP_NAME_HERE"
MCP_URL = "MCP_URL_HERE"
KEY_NAME = "KEY_NAME_HERE"

# Get key from Keychain (never printed)
result = subprocess.run(
    ["security", "find-generic-password", "-a", os.environ["USER"], "-s", KEY_NAME, "-w"],
    capture_output=True, text=True
)
if result.returncode != 0:
    print(f"[ERROR] Could not retrieve {KEY_NAME} from Keychain")
    exit(1)

api_key = result.stdout.strip()

# Read existing config
config_path = os.path.expanduser("~/.claude.json")
with open(config_path, "r") as f:
    config = json.load(f)

# Add MCP server
if "mcpServers" not in config:
    config["mcpServers"] = {}

config["mcpServers"][MCP_NAME] = {
    "type": "http",
    "url": MCP_URL,
    "headers": {
        "Authorization": f"Bearer {api_key}"
    }
}

# Write back
with open(config_path, "w") as f:
    json.dump(config, f, indent=2)

print(f"[SUCCESS] Added {MCP_NAME} MCP to Claude Code")
print(f"[SUCCESS] Key retrieved from Keychain (never displayed)")
PYTHON_SCRIPT
```

## Step 4: Add to OpenCode (~/.config/opencode/opencode.json)

For OpenCode, we can use environment variable syntax which is safer:

```bash
python3 << 'PYTHON_SCRIPT'
import json
import os

# Configuration - REPLACE THESE
MCP_NAME = "MCP_NAME_HERE"
MCP_URL = "MCP_URL_HERE"
KEY_NAME = "KEY_NAME_HERE"

config_path = os.path.expanduser("~/.config/opencode/opencode.json")

# Read existing config
with open(config_path, "r") as f:
    config = json.load(f)

# Add MCP server with env var reference (OpenCode expands this at runtime)
if "mcp" not in config:
    config["mcp"] = {}

config["mcp"][MCP_NAME] = {
    "type": "remote",
    "url": MCP_URL,
    "enabled": True,
    "headers": {
        "Authorization": "Bearer {env:" + KEY_NAME + "}"
    }
}

# Write back
with open(config_path, "w") as f:
    json.dump(config, f, indent=2)

print(f"[SUCCESS] Added {MCP_NAME} MCP to OpenCode")
print(f"[SUCCESS] Configured to use {{env:{KEY_NAME}}} (loaded from environment at runtime)")
PYTHON_SCRIPT
```

**Note:** OpenCode requires the key to be exported in ~/.zshrc:
```bash
grep -q "KEY_NAME" ~/.zshrc || echo 'export KEY_NAME=$(security find-generic-password -a "$USER" -s "KEY_NAME" -w 2>/dev/null)' >> ~/.zshrc
```

## Step 5: Verify Installation

```bash
# For Claude Code
claude mcp list 2>/dev/null | grep -i "MCP_NAME" && echo "[OK] MCP_NAME visible in Claude Code" || echo "[CHECK] Restart Claude Code to see MCP_NAME"

# For OpenCode - just confirm the config exists
grep -q "MCP_NAME" ~/.config/opencode/opencode.json && echo "[OK] MCP_NAME configured in OpenCode"
```

## Step 6: Remind User to Restart

Tell the user:
- "Restart Claude Code / OpenCode for the MCP to be available"
- "Use `/mcp` to see connected servers"
- "The API key was pulled from Keychain and written directly to config - it was never displayed"
</process>

<warning>
## NEVER DO THIS

```bash
# UNSAFE - exposes key in terminal output!
claude mcp add --transport http tally https://api.tally.so/mcp \
  --header "Authorization: Bearer $(security find-generic-password -a "$USER" -s "TALLY_API_KEY" -w)"
```

The `claude mcp add` command echoes the full config including headers back to the terminal. Always use this workflow instead.
</warning>

<success_criteria>
This workflow is complete when:
- [ ] Key verified in Keychain
- [ ] MCP config added to target (Claude Code and/or OpenCode)
- [ ] Key was NEVER echoed to terminal
- [ ] User reminded to restart their tool
- [ ] User can verify MCP is connected
</success_criteria>
