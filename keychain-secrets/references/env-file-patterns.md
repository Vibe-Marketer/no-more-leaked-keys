# .env File Patterns Reference

<overview>
Safe patterns for working with .env files when using Keychain as the source of truth.
</overview>

<gitignore_protection>
## Always Protect .env

Before creating any .env file, ensure it's in .gitignore:

```bash
# Check if .gitignore exists and has .env
if [ -f .gitignore ]; then
    grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
else
    echo ".env" > .gitignore
fi
```

Also consider ignoring:
```
.env
.env.local
.env.*.local
*.env
```
</gitignore_protection>

<env_file_format>
## .env File Format

Standard format:
```bash
KEY_NAME=value
ANOTHER_KEY=another_value
```

Rules:
- No spaces around `=`
- No quotes needed for simple values
- Use quotes for values with spaces: `KEY="value with spaces"`
- Comments start with `#`
- Blank lines are ignored
</env_file_format>

<generation_patterns>
## Generating .env from Keychain

### Simple Generation
```bash
> .env  # Clear/create file
echo "OPENAI_API_KEY=$(security find-generic-password -a "$USER" -s "OPENAI_API_KEY" -w)" >> .env
echo "DATABASE_URL=$(security find-generic-password -a "$USER" -s "DATABASE_URL" -w)" >> .env
```

### With Error Handling
```bash
add_key_to_env() {
    local key=$1
    local value=$(security find-generic-password -a "$USER" -s "$key" -w 2>/dev/null)
    if [ -n "$value" ]; then
        echo "$key=$value" >> .env
        echo "Added $key"
    else
        echo "# $key not found in Keychain" >> .env
        echo "Warning: $key not found"
    fi
}

> .env
add_key_to_env "OPENAI_API_KEY"
add_key_to_env "DATABASE_URL"
```

### Reusable Script (populate-env.sh)
```bash
#!/bin/bash
# populate-env.sh - Generate .env from Keychain

KEYS=(
    "OPENAI_API_KEY"
    "ANTHROPIC_API_KEY"
    "DATABASE_URL"
    # Add your keys here
)

# Ensure .gitignore protection
if [ -f .gitignore ]; then
    grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
else
    echo ".env" > .gitignore
fi

# Generate .env
> .env
found=0
missing=0

for key in "${KEYS[@]}"; do
    value=$(security find-generic-password -a "$USER" -s "$key" -w 2>/dev/null)
    if [ -n "$value" ]; then
        echo "$key=$value" >> .env
        ((found++))
    else
        echo "# $key - NOT FOUND" >> .env
        ((missing++))
    fi
done

echo "Generated .env: $found keys found, $missing missing"
```
</generation_patterns>

<project_templates>
## .env.example Template

Create a .env.example that documents required keys without values:

```bash
# .env.example - Required environment variables
# Copy to .env and populate from Keychain: ./populate-env.sh

# OpenAI API
OPENAI_API_KEY=

# Anthropic API
ANTHROPIC_API_KEY=

# Database
DATABASE_URL=

# Stripe (if using payments)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
```

This file IS committed to git (no secrets) and documents what the project needs.
</project_templates>

<verification>
## Verifying .env

### Check Keys Present (values hidden)
```bash
cut -d= -f1 .env | grep -v "^#" | grep -v "^$"
```

### Count Keys
```bash
grep -c "=" .env
```

### Check for Empty Values
```bash
grep "=$" .env  # Lines ending with = have no value
```

### Validate Format
```bash
# Lines should match: KEY=value or be comments/blank
grep -v "^#" .env | grep -v "^$" | grep -v "^[A-Z_]*=" && echo "Invalid lines found" || echo "Format OK"
```
</verification>

<framework_loading>
## Framework-Specific Loading

### Node.js (dotenv)
```javascript
require('dotenv').config();
// or in ES modules:
import 'dotenv/config';
```

### Python (python-dotenv)
```python
from dotenv import load_dotenv
load_dotenv()
```

### Next.js
Automatic - .env.local is loaded by default.

### Vite
Automatic - .env files are loaded. Use `VITE_` prefix for client-side vars.
</framework_loading>

<security_reminders>
## Security Reminders

1. **Never commit .env** - Always in .gitignore
2. **Never log env vars** - Don't `console.log(process.env)`
3. **Never expose in client code** - Only use server-side
4. **Regenerate, don't edit** - If you need to change keys, update Keychain and regenerate .env
5. **.env.example is safe** - Commit it to document required vars (no values)
6. **Set file permissions** - Always `chmod 600 .env` (owner read/write only)
7. **Clear clipboard** - After pasting keys, clipboard is auto-cleared to prevent accidents
</security_reminders>

<file_permissions>
## Securing .env File Permissions

After creating .env, always set restrictive permissions:

```bash
chmod 600 .env
```

This means:
- Owner can read and write (you)
- Group has no access
- Others have no access

Verify with:
```bash
ls -la .env
# Should show: -rw-------
```
</file_permissions>
