#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, total, message) {
  log(`[${step}/${total}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

// Check if running on macOS
if (os.platform() !== 'darwin') {
  log('\n============================================', 'red');
  log('  This tool only works on macOS', 'red');
  log('============================================', 'red');
  log('\nIt uses macOS Keychain for secure key storage.');
  log('For other platforms, see the README for alternatives.\n');
  process.exit(1);
}

const HOME = os.homedir();
const PACKAGE_DIR = path.join(__dirname, '..');

// Claude Code directories
const CLAUDE_DIR = path.join(HOME, '.claude');
const CLAUDE_SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const CLAUDE_COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');
const CLAUDE_HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks');
const CLAUDE_SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');

// OpenCode directories
const OPENCODE_DIR = path.join(HOME, '.config', 'opencode');
const OPENCODE_SKILLS_DIR = path.join(OPENCODE_DIR, 'skills');
const OPENCODE_COMMANDS_DIR = path.join(OPENCODE_DIR, 'commands');
const OPENCODE_HOOKS_DIR = path.join(OPENCODE_DIR, 'hooks');
const OPENCODE_SETTINGS_FILE = path.join(OPENCODE_DIR, 'settings.json');

log('\n======================================', 'bright');
log('  No More Leaked Keys - Installer', 'bright');
log('======================================\n', 'bright');

const TOTAL_STEPS = 7;

// Step 1: Create directories for both Claude Code and OpenCode
logStep(1, TOTAL_STEPS, 'Creating directories...');
[
  CLAUDE_SKILLS_DIR, CLAUDE_COMMANDS_DIR, CLAUDE_HOOKS_DIR,
  OPENCODE_SKILLS_DIR, OPENCODE_COMMANDS_DIR, OPENCODE_HOOKS_DIR
].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
logSuccess('Directories ready (Claude Code + OpenCode)');

// Step 2: Install skill to both
logStep(2, TOTAL_STEPS, 'Installing keychain-secrets skill...');
const skillSrc = path.join(PACKAGE_DIR, 'keychain-secrets');
fs.cpSync(skillSrc, path.join(CLAUDE_SKILLS_DIR, 'keychain-secrets'), { recursive: true });
fs.cpSync(skillSrc, path.join(OPENCODE_SKILLS_DIR, 'keychain-secrets'), { recursive: true });
logSuccess('Skill installed to Claude Code and OpenCode');

// Step 3: Install commands to both
logStep(3, TOTAL_STEPS, 'Installing slash commands...');
const commandsSrc = path.join(PACKAGE_DIR, 'commands');
fs.readdirSync(commandsSrc).forEach(file => {
  if (file.endsWith('.md')) {
    fs.copyFileSync(path.join(commandsSrc, file), path.join(CLAUDE_COMMANDS_DIR, file));
    fs.copyFileSync(path.join(commandsSrc, file), path.join(OPENCODE_COMMANDS_DIR, file));
  }
});
logSuccess('Commands installed: /secrets, /add-mcp');

// Step 4: Install hook to both
logStep(4, TOTAL_STEPS, 'Installing security hook...');
const hookSrc = path.join(PACKAGE_DIR, 'hooks', 'block-unsafe-mcp-add.sh');
const claudeHookDest = path.join(CLAUDE_HOOKS_DIR, 'block-unsafe-mcp-add.sh');
const opencodeHookDest = path.join(OPENCODE_HOOKS_DIR, 'block-unsafe-mcp-add.sh');
fs.copyFileSync(hookSrc, claudeHookDest);
fs.copyFileSync(hookSrc, opencodeHookDest);
fs.chmodSync(claudeHookDest, '755');
fs.chmodSync(opencodeHookDest, '755');
logSuccess('Security hook installed to both');

// Step 5: Configure Claude Code settings
logStep(5, TOTAL_STEPS, 'Configuring Claude Code...');

function configureHook(settingsFile, hookPath) {
  let settings = {};
  if (fs.existsSync(settingsFile)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    } catch (e) {
      // Will create new
    }
  }

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];

  const hookExists = settings.hooks.PreToolUse.some(
    hook => JSON.stringify(hook).includes('block-unsafe-mcp-add.sh')
  );

  if (!hookExists) {
    settings.hooks.PreToolUse.push({
      matcher: 'Bash',
      hooks: [{
        type: 'command',
        command: `bash ${hookPath}`
      }]
    });
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    return 'configured';
  }
  return 'already configured';
}

const claudeResult = configureHook(CLAUDE_SETTINGS_FILE, '~/.claude/hooks/block-unsafe-mcp-add.sh');
logSuccess(`Claude Code hook ${claudeResult}`);

// Step 6: Configure OpenCode settings
logStep(6, TOTAL_STEPS, 'Configuring OpenCode...');
const opencodeResult = configureHook(OPENCODE_SETTINGS_FILE, '~/.config/opencode/hooks/block-unsafe-mcp-add.sh');
logSuccess(`OpenCode hook ${opencodeResult}`);

// Step 7: Add shell protection
logStep(7, TOTAL_STEPS, 'Adding shell-level protection...');

const shellProtection = `
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
                echo 'The "claude mcp add" command with auth headers'
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
`;

// Detect shell config
let shellRc = path.join(HOME, '.zshrc');
if (!fs.existsSync(shellRc)) {
  shellRc = path.join(HOME, '.bashrc');
}

let shellContent = '';
if (fs.existsSync(shellRc)) {
  shellContent = fs.readFileSync(shellRc, 'utf8');
}

if (!shellContent.includes('No More Leaked Keys - Security Protection')) {
  fs.appendFileSync(shellRc, shellProtection);
  logSuccess(`Shell protection added to ${shellRc}`);
} else {
  logSuccess('Shell protection already configured');
}

// Done!
log('\n======================================', 'green');
log('  Installation Complete!', 'green');
log('======================================\n', 'green');

log("What's installed:", 'bright');
log('  • Claude Code: ~/.claude/skills/, commands/, hooks/');
log('  • OpenCode:    ~/.config/opencode/skills/, commands/, hooks/');
log('  • Commands:    /secrets, /add-mcp');
log('  • Shell:       Protection function in ~/.zshrc');

log('\nUsage:', 'bright');
log('  • Type /secrets to manage API keys');
log('  • Type /add-mcp to securely add MCP servers');
log('  • Works in BOTH Claude Code and OpenCode');

log('\nProtection is active at THREE levels:', 'bright');
log('  1. Claude Code hook - blocks unsafe commands');
log('  2. OpenCode hook - blocks unsafe commands');
log('  3. Shell function - blocks manual terminal commands');

log('\nTo activate shell protection now, run:', 'yellow');
log(`  source ${shellRc}\n`);

log('Or restart your terminal.\n');

// Social links
log('─────────────────────────────────────', 'cyan');
log('Built by Andrew Naegele', 'cyan');
log('Community: https://skool.com/vibe-marketing', 'cyan');
log('─────────────────────────────────────\n', 'cyan');
