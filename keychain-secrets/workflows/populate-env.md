# Workflow: Populate .env from Keychain

<required_reading>
**Read these reference files NOW:**
1. references/keychain-commands.md
2. references/env-file-patterns.md
</required_reading>

<process>
## Step 1: Identify Required Keys

Ask the user or detect from the project:
- Check for `.env.example` or `.env.template` in the project
- Check for environment variable references in code (e.g., `process.env.X`, `os.environ["X"]`)
- Ask the user what keys the project needs

```bash
# Check for .env.example
cat .env.example 2>/dev/null || echo "No .env.example found"

# Search for env var usage
grep -r "process\.env\." --include="*.js" --include="*.ts" . 2>/dev/null | head -20
grep -r "os\.environ" --include="*.py" . 2>/dev/null | head -20
```

## Step 2: Check Keychain for Available Keys

For each required key, check if it exists in Keychain:

```bash
# Check if a key exists (returns 0 if found, non-zero if not)
security find-generic-password -a "$USER" -s "KEY_NAME" -w >/dev/null 2>&1 && echo "Found" || echo "Not found"
```

Report which keys are available and which are missing.

## Step 3: Handle Missing Keys

If keys are missing from Keychain:

1. Ask the user if they want to add the missing keys now
2. If yes, switch to the `add-key.md` workflow for each missing key
3. If no, proceed with available keys only (warn about missing ones)

## Step 4: Ensure .gitignore Protection

Before writing .env, verify it's protected:

```bash
# Check if .gitignore exists and contains .env
if [ -f .gitignore ]; then
    grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
else
    echo ".env" > .gitignore
fi
```

## Step 5: Generate .env File

Write each key to .env by retrieving from Keychain, then secure the file:

```bash
# Create or overwrite .env
> .env

# Add each key
echo "OPENAI_API_KEY=$(security find-generic-password -a "$USER" -s "OPENAI_API_KEY" -w 2>/dev/null)" >> .env
echo "ANTHROPIC_API_KEY=$(security find-generic-password -a "$USER" -s "ANTHROPIC_API_KEY" -w 2>/dev/null)" >> .env
# ... repeat for each key

# IMPORTANT: Secure file permissions (only owner can read/write)
chmod 600 .env
```

**Alternative: Create a reusable script**

```bash
cat > populate-env.sh << 'EOF'
#!/bin/bash
# Populate .env from macOS Keychain
# Add key names to the KEYS array

KEYS=(
    "OPENAI_API_KEY"
    "ANTHROPIC_API_KEY"
    # Add more keys here
)

# Ensure .gitignore protection
[ -f .gitignore ] && grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore

> .env
for key in "${KEYS[@]}"; do
    value=$(security find-generic-password -a "$USER" -s "$key" -w 2>/dev/null)
    if [ -n "$value" ]; then
        echo "$key=$value" >> .env
        echo "[OK] $key"
    else
        echo "[MISSING] $key"
    fi
done

# Secure file permissions
chmod 600 .env
echo "Done. .env created with secure permissions (600)."
EOF
chmod +x populate-env.sh
```

## Step 6: Verify Success

```bash
# Count lines in .env (should match expected key count)
wc -l .env

# Show keys present (values hidden)
cut -d= -f1 .env
```
</process>

<success_criteria>
This workflow is complete when:
- [ ] All required keys identified
- [ ] Missing keys reported to user (and optionally added)
- [ ] .env is in .gitignore
- [ ] .env file created with keys from Keychain
- [ ] User can verify which keys were populated
</success_criteria>
