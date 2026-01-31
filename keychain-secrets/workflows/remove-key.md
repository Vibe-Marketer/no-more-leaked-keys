# Workflow: Remove Key from Keychain

<required_reading>
**Read these reference files NOW:**
1. references/keychain-commands.md
</required_reading>

<process>
## Step 1: Confirm Key Name

Ask the user which key they want to remove. Verify it exists first:

```bash
security find-generic-password -a "$USER" -s "KEY_NAME" -w >/dev/null 2>&1 && \
echo "Key found: KEY_NAME" || \
echo "Key not found: KEY_NAME"
```

## Step 2: Confirm Deletion

**IMPORTANT**: Deletion is permanent. Confirm with the user:

"Are you sure you want to delete KEY_NAME from Keychain? This cannot be undone. You will need to re-add the key if you need it again."

## Step 3: Delete the Key

```bash
security delete-generic-password -a "$USER" -s "KEY_NAME"
```

Expected output on success:
```
password has been deleted.
```

## Step 4: Verify Deletion

```bash
security find-generic-password -a "$USER" -s "KEY_NAME" -w >/dev/null 2>&1 && \
echo "Error: Key still exists" || \
echo "Confirmed: KEY_NAME has been removed"
```

## Step 5: Update .env if Needed

If a .env file exists and contains this key, warn the user:

```bash
if [ -f .env ] && grep -q "KEY_NAME=" .env; then
    echo "Warning: .env still contains KEY_NAME"
    echo "You may want to regenerate .env or remove this line"
fi
```

## Step 6: Offer Next Steps

Ask the user:
1. **Remove another key** - Repeat this workflow
2. **Re-add this key** - Switch to add-key.md workflow
3. **Update .env** - Switch to populate-env.md workflow
4. **Done** - Exit skill
</process>

<success_criteria>
This workflow is complete when:
- [ ] Key existence confirmed
- [ ] User confirmed deletion
- [ ] Key deleted from Keychain
- [ ] Deletion verified
- [ ] User warned about .env if applicable
</success_criteria>
