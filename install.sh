#!/bin/bash
# Install script for no-more-leaked-keys
# This script installs the skill, commands, and security hooks

set -e

echo ""
echo "======================================"
echo "  No More Leaked Keys - Installer"
echo "======================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create directories if they don't exist
echo "[1/6] Creating directories..."
mkdir -p ~/.claude/skills
mkdir -p ~/.claude/commands
mkdir -p ~/.claude/hooks

# Install the skill
echo "[2/6] Installing keychain-secrets skill..."
cp -r "$SCRIPT_DIR/keychain-secrets" ~/.claude/skills/

# Install the commands
echo "[3/6] Installing slash commands..."
cp "$SCRIPT_DIR/commands/secrets.md" ~/.claude/commands/
cp "$SCRIPT_DIR/commands/add-mcp.md" ~/.claude/commands/

# Install the security hook
echo "[4/6] Installing security hook..."
cp "$SCRIPT_DIR/hooks/block-unsafe-mcp-add.sh" ~/.claude/hooks/
chmod +x ~/.claude/hooks/block-unsafe-mcp-add.sh

# Add hook to Claude settings
echo "[5/6] Configuring Claude Code to use security hook..."

# Check if settings.json exists
SETTINGS_FILE="$HOME/.claude/settings.json"
if [ -f "$SETTINGS_FILE" ]; then
    # Check if hooks section exists and add our hook
    if grep -q '"PreToolUse"' "$SETTINGS_FILE"; then
        # PreToolUse exists, check if our hook is already there
        if ! grep -q 'block-unsafe-mcp-add.sh' "$SETTINGS_FILE"; then
            echo "  Note: PreToolUse hooks exist. Please manually add this hook:"
            echo '  {"matcher": "Bash", "hooks": [{"type": "command", "command": "bash ~/.claude/hooks/block-unsafe-mcp-add.sh"}]}'
        else
            echo "  Security hook already configured."
        fi
    else
        # Need to add PreToolUse section - use Python for safe JSON manipulation
        python3 << 'PYTHON_SCRIPT'
import json
import os

settings_path = os.path.expanduser("~/.claude/settings.json")

with open(settings_path, "r") as f:
    settings = json.load(f)

if "hooks" not in settings:
    settings["hooks"] = {}

if "PreToolUse" not in settings["hooks"]:
    settings["hooks"]["PreToolUse"] = []

# Check if hook already exists
hook_exists = any(
    "block-unsafe-mcp-add.sh" in str(hook)
    for hook in settings["hooks"]["PreToolUse"]
)

if not hook_exists:
    settings["hooks"]["PreToolUse"].append({
        "matcher": "Bash",
        "hooks": [{
            "type": "command",
            "command": "bash ~/.claude/hooks/block-unsafe-mcp-add.sh"
        }]
    })

with open(settings_path, "w") as f:
    json.dump(settings, f, indent=2)

print("  Security hook configured successfully.")
PYTHON_SCRIPT
    fi
else
    # Create new settings.json with hook
    cat > "$SETTINGS_FILE" << 'EOF'
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/block-unsafe-mcp-add.sh"
          }
        ]
      }
    ]
  }
}
EOF
    echo "  Created settings.json with security hook."
fi

# Add shell-level protection
echo "[6/6] Adding shell-level protection..."

SHELL_PROTECTION='
# ============================================
# No More Leaked Keys - Security Protection
# Blocks unsafe "claude mcp add" with auth headers
# ============================================
claude() {
    if [[ "$1" == "mcp" && "$2" == "add" ]]; then
        for arg in "$@"; do
            if [[ "$arg" =~ [Aa]uthorization.*[Bb]earer || "$arg" =~ [Bb]earer ]]; then
                echo ""
                echo "============================================"
                echo "  BLOCKED: Unsafe MCP Command Detected"
                echo "============================================"
                echo ""
                echo "The \"claude mcp add\" command with auth headers"
                echo "exposes your API key in terminal output!"
                echo ""
                echo "Use these safe alternatives instead:"
                echo "  - /secrets  (in Claude Code)"
                echo "  - /add-mcp  (in Claude Code)"
                echo ""
                echo "These pull keys from Keychain securely."
                echo "See: https://github.com/Vibe-Marketer/no-more-leaked-keys"
                echo ""
                return 1
            fi
        done
    fi
    command claude "$@"
}
'

# Detect shell config file
if [ -n "$ZSH_VERSION" ] || [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ -f "$HOME/.bashrc" ]; then
    SHELL_RC="$HOME/.bashrc"
else
    SHELL_RC="$HOME/.zshrc"
fi

# Add protection if not already present
if ! grep -q "No More Leaked Keys - Security Protection" "$SHELL_RC" 2>/dev/null; then
    echo "$SHELL_PROTECTION" >> "$SHELL_RC"
    echo "  Shell protection added to $SHELL_RC"
else
    echo "  Shell protection already configured."
fi

echo ""
echo "======================================"
echo "  Installation Complete!"
echo "======================================"
echo ""
echo "What's installed:"
echo "  - Skill: ~/.claude/skills/keychain-secrets/"
echo "  - Commands: /secrets, /add-mcp"
echo "  - Claude Code hook: Blocks unsafe commands from Claude"
echo "  - Shell protection: Blocks unsafe commands from terminal"
echo ""
echo "Usage:"
echo "  - Type /secrets to manage API keys"
echo "  - Type /add-mcp to securely add MCP servers"
echo ""
echo "Protection is now active at TWO levels:"
echo "  1. Claude Code hook - blocks Claude from running unsafe commands"
echo "  2. Shell function - blocks YOU from running unsafe commands"
echo ""
echo "To activate shell protection now, run:"
echo "  source $SHELL_RC"
echo ""
echo "Or restart your terminal."
echo ""
