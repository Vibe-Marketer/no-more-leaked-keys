# Workflow: Add Key to Keychain Securely

<required_reading>
**Read these reference files NOW:**
1. references/keychain-commands.md
</required_reading>

<process>
## Step 1: Get Key Name

Ask the user what key they want to add. Suggest common options:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `DATABASE_URL`
- Or let them specify a custom name (SCREAMING_SNAKE_CASE)

## Step 2: Check if Key Already Exists and Handle It

Run this check:
```bash
security find-generic-password -a "$USER" -s "KEY_NAME" -w >/dev/null 2>&1 && echo "EXISTS" || echo "NEW"
```

If it exists, ask: "This key already exists. Replace it with a new value?"
- If yes, delete the old one first: `security delete-generic-password -a "$USER" -s "KEY_NAME" 2>/dev/null`
- If no, cancel and offer to add a different key

## Step 3: Open Terminal Window for Secure Input

**Claude opens a new Terminal window where the user pastes their key.**

Use this AppleScript command to open Terminal with the secure input prompt:

```bash
osascript -e 'tell application "Terminal"
    activate
    do script "clear && echo \"\" && echo \"====================================\" && echo \"  SECURE API KEY INPUT\" && echo \"====================================\" && echo \"\" && echo \"Paste your key below (it will be invisible)\" && echo \"Then press ENTER\" && echo \"\" && echo -n \"KEY_NAME: \" && read -s K && security add-generic-password -a \"$USER\" -s \"KEY_NAME\" -w \"$K\" && unset K && pbcopy < /dev/null && echo \"\" && echo \"\" && echo \"[SUCCESS] KEY_NAME stored in Keychain\" && echo \"[SUCCESS] Clipboard cleared\" && echo \"\" && echo \"You can close this window now.\" && echo \"\""
end tell'
```

**What happens:**
1. A new Terminal window opens and comes to front
2. User sees clear instructions
3. User pastes (Cmd+V) - nothing appears on screen
4. User presses Enter
5. Key is stored in Keychain (encrypted)
6. Clipboard is cleared
7. Success message shown
8. User closes the window

**After running:** Wait for user to confirm they completed it, then verify storage.

## Step 4: Verify Storage

Immediately verify the key was stored:
```bash
security find-generic-password -a "$USER" -s "KEY_NAME" -w >/dev/null 2>&1 && \
echo "[VERIFIED] KEY_NAME is now stored in Keychain" || \
echo "[ERROR] KEY_NAME was not stored - please try again"
```

## Step 5: Offer Next Steps

Ask the user:
1. **Add another key** - Repeat this workflow
2. **Populate .env** - Switch to populate-env.md workflow  
3. **Done** - Exit skill
</process>

<terminal_commands>
## Terminal Window Commands (Claude runs these via osascript)

**Template - replace KEY_NAME:**
```bash
osascript -e 'tell application "Terminal"
    activate
    do script "clear && echo \"\" && echo \"====================================\" && echo \"  SECURE API KEY INPUT\" && echo \"====================================\" && echo \"\" && echo \"Paste your key below (it will be invisible)\" && echo \"Then press ENTER\" && echo \"\" && echo -n \"KEY_NAME: \" && read -s K && security add-generic-password -a \"$USER\" -s \"KEY_NAME\" -w \"$K\" && unset K && pbcopy < /dev/null && echo \"\" && echo \"\" && echo \"[SUCCESS] KEY_NAME stored in Keychain\" && echo \"[SUCCESS] Clipboard cleared\" && echo \"\" && echo \"You can close this window now.\""
end tell'
```

**For updating existing key (delete first):**
```bash
osascript -e 'tell application "Terminal"
    activate
    do script "clear && echo \"\" && echo \"====================================\" && echo \"  UPDATE API KEY\" && echo \"====================================\" && echo \"\" && security delete-generic-password -a \"$USER\" -s \"KEY_NAME\" 2>/dev/null && echo \"Paste your NEW key below (invisible)\" && echo \"Then press ENTER\" && echo \"\" && echo -n \"KEY_NAME: \" && read -s K && security add-generic-password -a \"$USER\" -s \"KEY_NAME\" -w \"$K\" && unset K && pbcopy < /dev/null && echo \"\" && echo \"\" && echo \"[SUCCESS] KEY_NAME updated in Keychain\" && echo \"[SUCCESS] Clipboard cleared\" && echo \"\" && echo \"You can close this window now.\""
end tell'
```
</terminal_commands>

<success_criteria>
This workflow is complete when:
- [ ] Key name confirmed with user
- [ ] Existing key check performed
- [ ] User provided with secure input command
- [ ] User confirmed they ran the command
- [ ] Key storage verified
- [ ] User offered next steps
</success_criteria>
