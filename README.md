# No More Leaked Keys

**Stop accidentally committing API keys to git.** Store them in macOS Keychain, populate `.env` files on demand.

[![License](https://img.shields.io/badge/license-Custom-blue.svg)](#license)
[![macOS](https://img.shields.io/badge/platform-macOS-lightgrey.svg)](#requirements)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Skill-purple.svg)](#installation)

---

## The Problem (You've Been Here)

You're building an app. You need API keys. So you do what everyone does:

```bash
# .env file
OPENAI_API_KEY=sk-abc123...
STRIPE_SECRET_KEY=sk_live_...
DATABASE_URL=postgres://user:password@...
```

Then one day:

- You forget `.env` isn't in `.gitignore`
- You `git add .` and push
- **Your keys are now public**
- Bots scrape GitHub constantly — they find your key in minutes
- You wake up to a $10,000 AWS bill
- Or your OpenAI account is drained
- Or your database is wiped

**This happens every single day to developers.**

Even if you're careful:
- Keys are visible when you paste them
- Keys sit in your clipboard (easy to accidentally paste in Slack)
- Keys are stored in plain text files
- Screen sharing? Recording? Your keys are exposed.

---

## The Solution

**Store API keys in macOS Keychain. Never in files.**

- Keychain is **encrypted** (AES-256)
- Keychain is **local** (not synced to cloud)
- Keychain is **scriptable** (we can automate it)
- Generate `.env` files **on demand** from Keychain
- Keys are **invisible** when you paste them
- Clipboard is **auto-cleared** after storing

**One Keychain. Every project. Zero risk.**

---

## How It Works

### Step 1: Store Your API Key (One Time)

A Terminal window opens with a secure prompt:

```
====================================
  SECURE API KEY INPUT
====================================

Paste your key below (it will be invisible)
Then press ENTER

OPENAI_API_KEY: █

[SUCCESS] OPENAI_API_KEY stored in Keychain
[SUCCESS] Clipboard cleared
```

**What happens:**
1. You paste your key — **nothing appears on screen**
2. Key is encrypted and stored in macOS Keychain
3. Your clipboard is cleared (can't accidentally paste elsewhere)
4. The variable is cleared from memory

**You never see the key. It never touches a file. It's encrypted immediately.**

### Step 2: Populate .env (Per Project)

When you start a project that needs environment variables:

```bash
# The skill reads .env.example and pulls from Keychain
[OK] OPENAI_API_KEY
[OK] ANTHROPIC_API_KEY  
[OK] DATABASE_URL
[MISSING] STRIPE_KEY  # Not in Keychain yet - prompts to add

Done. .env created with secure permissions (600).
```

The `.env` file is:
- Created with **owner-only permissions** (`chmod 600`)
- Automatically added to **`.gitignore`**
- **Never committed to git**

### Step 3: Use In Your Code (Normal .env Usage)

Your code works exactly the same:

**Python:**
```python
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.environ['OPENAI_API_KEY']
```

**Node.js:**
```javascript
require('dotenv').config()
const apiKey = process.env.OPENAI_API_KEY
```

**The difference:** Your keys came from Keychain, not a file you might accidentally commit.

---

## Security Model

Every layer is protected:

| Attack Vector | Protection |
|---------------|-----------|
| **Visible on screen** | `read -s` — silent input, nothing displayed |
| **Stays in memory** | `unset` — variable cleared immediately |
| **Left in clipboard** | `pbcopy < /dev/null` — clipboard auto-cleared |
| **Stored in plain text** | macOS Keychain — AES-256 encryption |
| **Readable by others** | `chmod 600` — owner-only file permissions |
| **Committed to git** | Auto-adds `.env` to `.gitignore` |
| **In terminal history** | Key never part of a command string |
| **MCP server config** | Direct file edit — never echoed to terminal |

---

## Adding MCP Servers Securely

**WARNING: Anthropic's `claude mcp add` command exposes your API key!**

The native `claude mcp add` command has a security flaw - it **echoes your API key** to the terminal:

```bash
# DANGEROUS - This prints your key to the terminal!
claude mcp add --transport http tally https://api.tally.so/mcp \
  --header "Authorization: Bearer $TALLY_API_KEY"
# Output includes: "Authorization": "Bearer sk-actual-key-here"  <-- EXPOSED!
```

**This skill fixes that.** After installation:
1. The unsafe command is **automatically blocked** by a security hook
2. You use `/secrets` or `/add-mcp` instead
3. Keys are pulled from Keychain silently and written directly to config
4. Keys are **never echoed anywhere**

```
> /secrets
> "Add MCP server securely"
> MCP name: tally
> MCP URL: https://api.tally.so/mcp
> Key name in Keychain: TALLY_API_KEY
> Target: claude

[SUCCESS] Added tally MCP to Claude Code
[SUCCESS] Key retrieved from Keychain (never displayed)
```

---

## Installation

### NPM Install (Recommended)

```bash
npx no-more-leaked-keys
```

Or install globally:

```bash
npm install -g no-more-leaked-keys
```

### Alternative: Git Clone

```bash
git clone https://github.com/Vibe-Marketer/no-more-leaked-keys.git && cd no-more-leaked-keys && ./install.sh
```

This installs:
- The skill (`/secrets`)
- The commands (`/add-mcp`)
- **A security hook that blocks unsafe `claude mcp add` commands**

Then restart Claude Code.

### What the Security Hook Does

After installation, if anyone (you or Claude) tries to run `claude mcp add` with authentication headers, it gets **automatically blocked**:

```
BLOCKED: claude mcp add with auth headers exposes your API key in terminal output!

Use /secrets or /add-mcp instead - these pull keys from Keychain securely 
without exposing them.
```

This protects you even if you forget and try to use the unsafe command.

### Manual Installation

If you prefer to install manually:

```bash
git clone https://github.com/Vibe-Marketer/no-more-leaked-keys.git
cd no-more-leaked-keys

# Install skill and commands
mkdir -p ~/.claude/skills ~/.claude/commands ~/.claude/hooks
cp -r keychain-secrets ~/.claude/skills/
cp commands/*.md ~/.claude/commands/
cp hooks/*.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh

# Then manually add the hook to ~/.claude/settings.json (see install.sh for details)
```

**Usage:**
- Type `/secrets` in Claude Code
- Or just say "add my API key" or "set up .env"

### For Everyone (Manual Terminal Usage)

You don't need Claude Code. Use these commands directly:

**Add a key to Keychain:**
```bash
echo -n "Paste API key: " && read -s K && \
security add-generic-password -a "$USER" -s "OPENAI_API_KEY" -w "$K" && \
unset K && pbcopy < /dev/null && echo -e "\nStored!"
```

**Retrieve a key:**
```bash
security find-generic-password -a "$USER" -s "OPENAI_API_KEY" -w
```

**Generate .env from Keychain:**
```bash
echo "OPENAI_API_KEY=$(security find-generic-password -a "$USER" -s "OPENAI_API_KEY" -w)" > .env
chmod 600 .env
echo ".env" >> .gitignore
```

---

## Why Keychain Over Other Methods?

| Method | Problem |
|--------|---------|
| **`.env` files** | Can be committed to git, stored in plain text |
| **Shell config (`~/.zshrc`)** | Visible in dotfiles, often synced to cloud |
| **Password managers (1Password, etc.)** | Requires manual copy/paste every time |
| **Environment variables in CI/CD** | Great for prod, but doesn't help local dev |
| **macOS Keychain** | Encrypted, local, scriptable, automatic |

---

## FAQ

### Is this actually secure?

Yes. macOS Keychain uses AES-256 encryption, the same standard used by banks and governments. Your keys are encrypted at rest and protected by your macOS login password.

### What if someone has access to my Mac?

If someone has your Mac AND your login password, they can access your Keychain. But at that point, they can also access everything else. Keychain is as secure as your Mac login.

### Does this work with Touch ID / Face ID?

Yes. Keychain integrates with biometric authentication. You may be prompted the first time an app accesses a key.

### Can I use this on Linux or Windows?

Not directly — this uses macOS Keychain. However:
- **Linux:** You could adapt this to use `gnome-keyring` or `pass`
- **Windows:** You could use Windows Credential Manager

PRs welcome for cross-platform support!

### What happens if I need to share keys with my team?

This is for **local development security**. For team/production secrets, use:
- 1Password / Bitwarden shared vaults
- AWS Secrets Manager
- HashiCorp Vault
- Doppler

### Will this slow down my workflow?

No. You add each key once. After that, populating `.env` for any project takes seconds.

### What if I delete a key by accident?

It's gone. Keychain doesn't have a recycle bin. You'll need to get the key again from wherever you originally got it (OpenAI dashboard, Stripe dashboard, etc.).

### Does the `.env` file contain my actual keys?

Yes, temporarily. The `.env` file is created with your keys so your code can read them. But:
- It has `600` permissions (only you can read it)
- It's in `.gitignore` (never committed)
- You can delete it and regenerate anytime

The difference is: you're not manually pasting keys where you might accidentally commit them.

---

## File Structure

```
no-more-leaked-keys/
├── README.md                 # You're reading this
├── LICENSE                   # Usage terms
├── install.sh                # One-command installer
├── keychain-secrets/         # Claude Code skill
│   ├── SKILL.md
│   ├── workflows/
│   │   ├── add-key.md        # Store keys in Keychain
│   │   ├── add-mcp.md        # Securely add MCP servers
│   │   ├── list-keys.md
│   │   ├── populate-env.md
│   │   └── remove-key.md
│   └── references/
│       ├── keychain-commands.md
│       └── env-file-patterns.md
├── commands/
│   ├── secrets.md            # /secrets slash command
│   └── add-mcp.md            # /add-mcp slash command
├── hooks/
│   └── block-unsafe-mcp-add.sh  # Security hook (blocks unsafe commands)
└── test-project/             # Example project for testing
    ├── .env.example
    ├── test-node.js
    └── test-python.py
```

---

## Requirements

- **macOS** (uses Keychain and `security` CLI)
- **Claude Code** (optional, for the skill — or use manual commands)

---

## Contributing

PRs welcome! Please ensure no actual secrets are committed (obviously).

---

## Connect

Built by **Andrew Naegele**

- **Community:** [skool.com/vibe-marketing](https://skool.com/vibe-marketing)
- **Website:** [callvaultai.com](https://callvaultai.com)
- **X/Twitter:** [@andrewnaegele](https://x.com/andrewnaegele)
- **LinkedIn:** [linkedin.com/in/andrewnaegele](https://linkedin.com/in/andrewnaegele)
- **Instagram:** [@andrew.naegele](https://instagram.com/andrew.naegele)
- **Facebook:** [facebook.com/andrewnaegele](https://facebook.com/andrewnaegele)

---

## License

See [LICENSE](LICENSE) for full terms.

**TL;DR:** Free to use for personal and commercial projects. Not for resale. Give credit. Star the repo.

---

**Stop leaking keys. Start using Keychain.**

If this saved you from a $10,000 mistake, consider:
- Starring this repo
- Joining the community at [skool.com/vibe-marketing](https://skool.com/vibe-marketing)
- Sharing with a developer friend who needs this
