# Workflow: List Stored Keys

<required_reading>
**Read these reference files NOW:**
1. references/keychain-commands.md
</required_reading>

<process>
## Step 1: List All Generic Passwords

The `security` command can dump keychain info, but we need to filter for our API keys:

```bash
# List all generic password entries (shows service names, not values)
security dump-keychain | grep -A 4 'class: "genp"' | grep '"svce"' | cut -d'"' -f4 | sort -u
```

This shows the service names (which are our key names like `OPENAI_API_KEY`).

## Step 2: Filter for Common API Keys

Check for commonly used API key names:

```bash
COMMON_KEYS=(
    "OPENAI_API_KEY"
    "ANTHROPIC_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "DATABASE_URL"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "GITHUB_TOKEN"
    "VERCEL_TOKEN"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "GOOGLE_API_KEY"
    "SENDGRID_API_KEY"
    "TWILIO_ACCOUNT_SID"
    "TWILIO_AUTH_TOKEN"
)

echo "Checking for common API keys in Keychain..."
echo "==========================================="
for key in "${COMMON_KEYS[@]}"; do
    if security find-generic-password -a "$USER" -s "$key" -w >/dev/null 2>&1; then
        echo "[FOUND] $key"
    fi
done
```

## Step 3: Present Results

Display found keys to the user in a clear format:

```
Available API Keys in Keychain:
================================
[FOUND] OPENAI_API_KEY
[FOUND] ANTHROPIC_API_KEY
[FOUND] DATABASE_URL

Not in Keychain (if you need them):
====================================
[ ] STRIPE_SECRET_KEY
[ ] GITHUB_TOKEN
```

## Step 4: Offer Next Steps

Ask the user:
1. **Add a missing key** - Switch to add-key.md workflow
2. **Populate .env** - Switch to populate-env.md workflow
3. **Done** - Exit skill
</process>

<success_criteria>
This workflow is complete when:
- [ ] Available keys listed
- [ ] User can see which keys are stored
- [ ] User offered next steps
</success_criteria>
