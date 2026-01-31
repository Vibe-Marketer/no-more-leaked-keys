---
name: keychain-secrets
description: "Securely manage API keys using macOS Keychain. Use when working with .env files, adding new API keys, or populating environment variables from Keychain. Triggers on: api key, keychain, .env, environment variables, secrets, credentials."
---

<essential_principles>
## Security-First API Key Management

This skill uses macOS Keychain to securely store and retrieve API keys. Keys are never stored in plain text, never committed to git, and never exposed on screen during input.

### Principle 1: Keychain is the Source of Truth

API keys live in Keychain, not in files. The `.env` file is populated at runtime from Keychain. This means:
- Keys are encrypted at rest by macOS
- Keys can be used across any project on your machine
- Accidental exposure via git or screen share is impossible

### Principle 2: Safe Input for New Keys

When adding keys to Keychain, we use `read -s` to prevent the key from appearing on screen. The key is passed directly to the `security` command without echoing.

### Principle 3: .env Files are Ephemeral

The `.env` file should be in `.gitignore` and can be regenerated anytime from Keychain. Never edit `.env` directly with secrets - always add to Keychain first.

### Key Naming Convention

Use SCREAMING_SNAKE_CASE that matches the environment variable name:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `DATABASE_URL`
</essential_principles>

<intake>
What would you like to do?

1. **Populate .env from Keychain** - Retrieve stored keys and write them to a .env file
2. **Add a new key to Keychain** - Securely store a new API key (won't appear on screen)
3. **List stored keys** - See what keys are available in your Keychain
4. **Remove a key** - Delete a key from Keychain

**Wait for response before proceeding.**
</intake>

<routing>
| Response | Workflow |
|----------|----------|
| 1, "populate", "env", "retrieve", "get", "write env" | `workflows/populate-env.md` |
| 2, "add", "store", "new key", "save" | `workflows/add-key.md` |
| 3, "list", "show", "available", "what keys" | `workflows/list-keys.md` |
| 4, "remove", "delete", "revoke" | `workflows/remove-key.md` |

**After reading the workflow, follow it exactly.**
</routing>

<reference_index>
All domain knowledge in `references/`:

**Commands:** keychain-commands.md - All macOS security CLI patterns
**Env Files:** env-file-patterns.md - Safe .env file handling
</reference_index>

<workflows_index>
| Workflow | Purpose |
|----------|---------|
| populate-env.md | Retrieve keys from Keychain and write to .env |
| add-key.md | Securely add a new API key to Keychain |
| list-keys.md | Show available keys in Keychain |
| remove-key.md | Delete a key from Keychain |
</workflows_index>

<quick_commands>
## Quick Reference

**Add key (Claude runs this - you just paste):**
```bash
read -s -p "Paste API key: " K && security add-generic-password -a "$USER" -s "KEY_NAME" -w "$K" && unset K && pbcopy < /dev/null && echo -e "\n[OK] Stored"
```

**Retrieve key:**
```bash
security find-generic-password -a "$USER" -s "KEY_NAME" -w
```

**Delete key:**
```bash
security delete-generic-password -a "$USER" -s "KEY_NAME"
```

**Populate .env from Keychain:**
```bash
echo "OPENAI_API_KEY=$(security find-generic-password -a "$USER" -s "OPENAI_API_KEY" -w 2>/dev/null)" >> .env && chmod 600 .env
```
</quick_commands>

<security_measures>
## Security Measures

This skill implements multiple layers of protection:

1. **Silent input** - Keys never appear on screen when you paste
2. **Memory cleanup** - Variables cleared immediately after use
3. **Clipboard clearing** - Auto-clears clipboard after storing key
4. **Encrypted storage** - macOS Keychain uses AES-256 encryption
5. **File permissions** - .env created with 600 permissions (owner only)
6. **Git protection** - Automatically adds .env to .gitignore
7. **No logging** - Keys never written to terminal history
</security_measures>
