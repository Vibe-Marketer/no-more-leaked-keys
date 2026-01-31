# macOS Keychain Security Commands Reference

<overview>
macOS provides the `security` CLI tool to interact with Keychain from the terminal. This reference covers all commands needed for API key management.
</overview>

<command_reference>
## Core Commands

### Add a Password
```bash
security add-generic-password -a "$USER" -s "SERVICE_NAME" -w "PASSWORD"
```

Parameters:
- `-a` : Account name (use `$USER` for current user)
- `-s` : Service name (the key identifier, e.g., `OPENAI_API_KEY`)
- `-w` : Password/secret value

**Will fail if key already exists.** Delete first to update.

### Retrieve a Password
```bash
security find-generic-password -a "$USER" -s "SERVICE_NAME" -w
```

Parameters:
- `-a` : Account name
- `-s` : Service name
- `-w` : Output only the password (not metadata)

Returns just the password value. Exit code 0 on success, non-zero if not found.

### Delete a Password
```bash
security delete-generic-password -a "$USER" -s "SERVICE_NAME"
```

Removes the entry from Keychain. Cannot be undone.

### Check if Password Exists
```bash
security find-generic-password -a "$USER" -s "SERVICE_NAME" -w >/dev/null 2>&1
echo $?  # 0 = exists, non-zero = not found
```

### List All Entries
```bash
# List all generic passwords (shows metadata, not values)
security dump-keychain | grep -A 4 'class: "genp"'

# Extract just service names
security dump-keychain | grep -A 4 'class: "genp"' | grep '"svce"' | cut -d'"' -f4 | sort -u
```
</command_reference>

<secure_patterns>
## Secure Input Patterns

### Silent Input with Clipboard Clear (Recommended)
```bash
read -s -p "Paste value: " VALUE && \
security add-generic-password -a "$USER" -s "KEY_NAME" -w "$VALUE" && \
unset VALUE && \
pbcopy < /dev/null && \
echo -e "\n[OK] Stored + clipboard cleared"
```

- `read -s` : Silent mode (no echo to screen)
- `unset VALUE` : Clear from shell memory after use
- `pbcopy < /dev/null` : Clear clipboard (prevents accidental paste elsewhere)
- Key never appears in terminal, history, or remains in clipboard

### Update Existing (Delete + Add)
```bash
security delete-generic-password -a "$USER" -s "KEY_NAME" 2>/dev/null; \
read -s -p "Enter new value: " VALUE && \
security add-generic-password -a "$USER" -s "KEY_NAME" -w "$VALUE" && \
unset VALUE
```

### Batch Check Multiple Keys
```bash
for key in OPENAI_API_KEY ANTHROPIC_API_KEY; do
    if security find-generic-password -a "$USER" -s "$key" -w >/dev/null 2>&1; then
        echo "[OK] $key"
    else
        echo "[MISSING] $key"
    fi
done
```
</secure_patterns>

<environment_integration>
## Using with Environment Variables

### Export to Shell
```bash
export OPENAI_API_KEY=$(security find-generic-password -a "$USER" -s "OPENAI_API_KEY" -w)
```

### In .zshrc or .bashrc (loads on shell start)
```bash
# ~/.zshrc
export OPENAI_API_KEY=$(security find-generic-password -a "$USER" -s "OPENAI_API_KEY" -w 2>/dev/null)
```

### Generate .env File
```bash
echo "OPENAI_API_KEY=$(security find-generic-password -a "$USER" -s "OPENAI_API_KEY" -w)" >> .env
```

### Use in Scripts (Python)
```python
import subprocess
import os

def get_keychain_secret(key_name):
    result = subprocess.run(
        ["security", "find-generic-password", "-a", os.environ["USER"], "-s", key_name, "-w"],
        capture_output=True, text=True
    )
    return result.stdout.strip() if result.returncode == 0 else None
```

### Use in Scripts (Node.js)
```javascript
const { execSync } = require('child_process');

function getKeychainSecret(keyName) {
    try {
        return execSync(`security find-generic-password -a "$USER" -s "${keyName}" -w`)
            .toString().trim();
    } catch {
        return null;
    }
}
```
</environment_integration>

<troubleshooting>
## Common Issues

### "security: SecKeychainSearchCopyNext: The specified item could not be found"
Key doesn't exist. Check the exact name with `security dump-keychain`.

### "already has an entry"
Key already exists. Delete first, then add:
```bash
security delete-generic-password -a "$USER" -s "KEY_NAME"
security add-generic-password -a "$USER" -s "KEY_NAME" -w "value"
```

### "User interaction is not allowed"
Running in a context without Keychain access (e.g., some CI environments). Not applicable for local development.

### Password Prompt on Access
macOS may prompt for your login password the first time a new application accesses a Keychain item. Click "Always Allow" to prevent future prompts.
</troubleshooting>
