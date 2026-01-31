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

// Directories
const CLAUDE_DIR = path.join(HOME, '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const COMMANDS_DIR = path.join(CLAUDE_DIR, 'commands');
const HOOKS_DIR = path.join(CLAUDE_DIR, 'hooks');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');

log('\n======================================', 'bright');
log('  No More Leaked Keys - Installer', 'bright');
log('======================================\n', 'bright');

const TOTAL_STEPS = 6;

// Step 1: Create directories
logStep(1, TOTAL_STEPS, 'Creating directories...');
[SKILLS_DIR, COMMANDS_DIR, HOOKS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
logSuccess('Directories ready');

// Step 2: Install skill
logStep(2, TOTAL_STEPS, 'Installing keychain-secrets skill...');
const skillSrc = path.join(PACKAGE_DIR, 'keychain-secrets');
const skillDest = path.join(SKILLS_DIR, 'keychain-secrets');
fs.cpSync(skillSrc, skillDest, { recursive: true });
logSuccess('Skill installed');

// Step 3: Install commands
logStep(3, TOTAL_STEPS, 'Installing slash commands...');
const commandsSrc = path.join(PACKAGE_DIR, 'commands');
fs.readdirSync(commandsSrc).forEach(file => {
  if (file.endsWith('.md')) {
    fs.copyFileSync(
      path.join(commandsSrc, file),
      path.join(COMMANDS_DIR, file)
    );
  }
});
logSuccess('Commands installed: /secrets, /add-mcp');

// Step 4: Install hook
logStep(4, TOTAL_STEPS, 'Installing security hook...');
const hookSrc = path.join(PACKAGE_DIR, 'hooks', 'block-unsafe-mcp-add.sh');
const hookDest = path.join(HOOKS_DIR, 'block-unsafe-mcp-add.sh');
fs.copyFileSync(hookSrc, hookDest);
fs.chmodSync(hookDest, '755');
logSuccess('Security hook installed');

// Step 5: Configure Claude Code settings
logStep(5, TOTAL_STEPS, 'Configuring Claude Code...');

let settings = {};
if (fs.existsSync(SETTINGS_FILE)) {
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch (e) {
    logWarning('Could not parse existing settings.json, creating new one');
  }
}

if (!settings.hooks) settings.hooks = {};
if (!settings.hooks.PreToolUse) settings.hooks.PreToolUse = [];

// Check if hook already exists
const hookExists = settings.hooks.PreToolUse.some(
  hook => JSON.stringify(hook).includes('block-unsafe-mcp-add.sh')
);

if (!hookExists) {
  settings.hooks.PreToolUse.push({
    matcher: 'Bash',
    hooks: [{
      type: 'command',
      command: 'bash ~/.claude/hooks/block-unsafe-mcp-add.sh'
    }]
  });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  logSuccess('Claude Code hook configured');
} else {
  logSuccess('Claude Code hook already configured');
}

// Step 6: Add shell protection
logStep(6, TOTAL_STEPS, 'Adding shell-level protection...');

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
log('  • Skill: ~/.claude/skills/keychain-secrets/');
log('  • Commands: /secrets, /add-mcp');
log('  • Claude Code hook: Blocks unsafe commands from Claude');
log('  • Shell protection: Blocks unsafe commands from terminal');

log('\nUsage:', 'bright');
log('  • Type /secrets to manage API keys');
log('  • Type /add-mcp to securely add MCP servers');

log('\nProtection is now active at TWO levels:', 'bright');
log('  1. Claude Code hook - blocks Claude from running unsafe commands');
log('  2. Shell function - blocks YOU from running unsafe commands');

log('\nTo activate shell protection now, run:', 'yellow');
log(`  source ${shellRc}\n`);

log('Or restart your terminal.\n');

// Social links
log('─────────────────────────────────────', 'cyan');
log('Built by Andrew Naegele', 'cyan');
log('Community: https://skool.com/vibe-marketing', 'cyan');
log('─────────────────────────────────────\n', 'cyan');
