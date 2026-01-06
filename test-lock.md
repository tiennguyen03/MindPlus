# App Lock Testing Checklist

## Phase 1: App Lock & Security Foundation

### Test 1: Initial State (No Lock)
- [ ] Fresh install shows no lock screen
- [ ] App opens directly to journal/setup
- [ ] Settings show "Enable App Lock" toggle OFF
- [ ] No passcode is set

### Test 2: Set Passcode
- [ ] Open Settings (⚙ button)
- [ ] Navigate to "Security & Privacy" section
- [ ] Click "Enable App Lock" checkbox
- [ ] Passcode setup form appears
- [ ] Enter passcode: "test1234"
- [ ] Confirm passcode: "test1234"
- [ ] Click "Set Passcode"
- [ ] Passcode is saved successfully
- [ ] "Passcode Set" badge appears
- [ ] Auto-Lock dropdown becomes available

### Test 3: Lock Screen on Restart
- [ ] Close the app completely
- [ ] Restart the app
- [ ] Lock screen appears immediately
- [ ] Shows lock icon 🔒
- [ ] Shows "MindPlus" title
- [ ] Shows passcode input field
- [ ] Input field is focused

### Test 4: Incorrect Passcode
- [ ] Enter wrong passcode: "wrong123"
- [ ] Click "Unlock" or press Enter
- [ ] Error message appears: "Incorrect passcode"
- [ ] Passcode field clears
- [ ] Input refocuses automatically

### Test 5: Correct Passcode
- [ ] Enter correct passcode: "test1234"
- [ ] Click "Unlock" or press Enter
- [ ] Lock screen disappears
- [ ] App content becomes visible
- [ ] Journal loads normally

### Test 6: Auto-Lock Timer
- [ ] Open Settings
- [ ] Set Auto-Lock to "After 1 minute"
- [ ] Save settings
- [ ] Wait 1 minute without any activity
- [ ] (Check every 30 seconds - the auto-lock check interval)
- [ ] Lock screen should appear after ~1 minute

### Test 7: Activity Tracking
- [ ] With auto-lock enabled (1 minute)
- [ ] Move mouse around periodically
- [ ] Click on things
- [ ] Type in editor
- [ ] Verify app does NOT lock while active
- [ ] Stop all activity for 1+ minute
- [ ] App should lock

### Test 8: Change Passcode
- [ ] Open Settings
- [ ] In Security section, click "Change Passcode"
- [ ] Current passcode is cleared
- [ ] Passcode setup form appears again
- [ ] Set new passcode: "newpass456"
- [ ] Confirm: "newpass456"
- [ ] Save
- [ ] Restart app
- [ ] Old passcode "test1234" should NOT work
- [ ] New passcode "newpass456" should work

### Test 9: Disable App Lock
- [ ] Open Settings
- [ ] Uncheck "Enable App Lock"
- [ ] Passcode is removed
- [ ] Auto-Lock options disappear
- [ ] Restart app
- [ ] No lock screen appears
- [ ] App opens directly

### Test 10: Settings Persistence
- [ ] Set passcode
- [ ] Set auto-lock to 5 minutes
- [ ] Restart app
- [ ] Unlock
- [ ] Check Settings
- [ ] Auto-lock should still be 5 minutes
- [ ] Passcode should still be set (show "Passcode Set" badge)

## Security Verification

### Passcode Storage
- [ ] Check settings.json file
- [ ] Passcode should be HASHED, not plaintext
- [ ] Should see `appLockPasscode: { hash: "...", salt: "..." }`
- [ ] Hash should be long (128+ characters)

### File Location
```bash
# On macOS:
cat ~/Library/Application\ Support/journal-mvp/settings.json

# Should NOT see plaintext passcode!
```

## Expected Behavior Summary

✅ **Security:**
- Passcode is always hashed with PBKDF2
- Never stored as plaintext
- Lock screen blocks all access

✅ **UX:**
- Clean lock screen (no journal content visible)
- Clear error messages
- Auto-focus on inputs
- Smooth transitions

✅ **Settings:**
- Easy to enable/disable
- Auto-lock is optional
- Passcode can be changed
- Settings persist across restarts

## Known Limitations (By Design)

⚠️ **No Password Recovery:**
- If user forgets passcode, cannot recover
- Must manually edit/delete settings.json
- This is intentional (security vs convenience tradeoff)

⚠️ **No Biometric Auth (Yet):**
- Only text passcode supported
- Touch ID/Face ID could be added later

⚠️ **No Failed Attempt Lockout:**
- Unlimited retry attempts
- Could add later if needed
