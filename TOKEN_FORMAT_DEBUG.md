# Token Format Issue - Debug Guide

## Error You're Seeing

```json
{
  "success": false,
  "error": "Invalid token format",
  "message": "Please logout and login again",
  "debug": {
    "error_type": "UnexpectedValueException",
    "error_message": "Wrong number of segments"
  }
}
```

## What This Means

### JWT Token Format
A valid JWT token has **exactly 3 parts** separated by dots:
```
header.payload.signature
```

Example:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxMjM0fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### "Wrong number of segments" Error
This means the token being sent does NOT have 3 parts. It could have:
- 0 parts (empty or corrupt)
- 1 part (partial token)
- 2 parts (incomplete token)
- 4+ parts (mangled token)

## Why This Happens

### Most Common Cause: Old Token in Browser
When you were logged in before we fixed the authentication system, your browser stored a token in a different format. That old token is still being used by the frontend.

### Other Possible Causes
1. **LocalStorage corruption** - Token got corrupted in browser storage
2. **Token truncation** - Token was cut off during save/load
3. **Wrong token type** - Using remember_token instead of JWT
4. **Multiple Bearer prefixes** - "Bearer Bearer eyJ..."

## How to Fix

### SOLUTION: Logout and Login Fresh

This is **MANDATORY** - you cannot skip this step!

#### Step-by-Step Instructions

1. **Open Browser DevTools (F12)**

2. **Go to Application Tab**
   - Look for "Local Storage" in left sidebar
   - Click on your domain (localhost:5173)
   - Find `auth_token` key
   - **Delete it** (right-click → Delete)

3. **Go to Console Tab**
   - Type: `localStorage.clear()`
   - Press Enter
   - Type: `sessionStorage.clear()`
   - Press Enter

4. **Close DevTools**

5. **Logout from Admin Dashboard**
   - Click logout button
   - Wait for redirect

6. **Clear Browser Cache**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "All time"
   - Check: Cookies, Cached images and files
   - Click "Clear data"

7. **Close ALL Browser Tabs**
   - Don't just close the admin tab
   - Close the ENTIRE browser
   - Wait 10 seconds

8. **Open Fresh Browser Window**

9. **Go Directly to Login**
   ```
   http://localhost:5173/admin
   ```

10. **Login with Credentials**
    ```
    Email: koromaemmanuel66@gmail.com
    Password: 2d5838dc71aacf3b
    ```

11. **Check Token in DevTools**
    - Open DevTools (F12)
    - Go to Application → Local Storage
    - Look at `auth_token` value
    - Should look like: `eyJhbGc...` (very long string with 2 dots)

12. **Test Services Tab**
    - Click on Services
    - Should work now!

## Verification

### Valid JWT Token Checklist
- [ ] Has 3 parts separated by dots
- [ ] Each part is base64url encoded
- [ ] Total length is 200-500+ characters
- [ ] Starts with `eyJ` (decoded: `{"`)
- [ ] No spaces or line breaks
- [ ] No "Bearer " prefix in storage (only in HTTP header)

### How to Check Your Token

**In Browser Console:**
```javascript
// Get token from localStorage
const token = localStorage.getItem('auth_token');
console.log('Token:', token);

// Count parts
const parts = token ? token.split('.') : [];
console.log('Parts count:', parts.length); // Should be 3

// Check first part (header)
if (parts[0]) {
  const header = JSON.parse(atob(parts[0]));
  console.log('Header:', header); // Should show {"typ":"JWT","alg":"HS256"}
}
```

Expected output:
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoz...
Parts count: 3
Header: {typ: "JWT", alg: "HS256"}
```

## Debug Information

### What the Server Will Log

After adding validation, when you try to access Services, check backend logs:

**If token is invalid:**
```
AUTH FAILED: Invalid token format. Token parts: 1
Full token received: abc123xyz
Auth header: Bearer abc123xyz
```

**If token is valid:**
```
AUTH CHECK: Valid JWT format with 3 parts. Token: eyJhbGciOiJIUzI1N...
JWT Decoded successfully. User ID: 37
User found: ID 37, Role: editor
Dashboard permission check: YES
AUTH SUCCESS: User ID 37 authenticated via JWT
```

### Check Backend Logs

**Windows:**
```powershell
Get-Content backend\logs\error.log -Tail 50 -Wait
```

**Linux/Mac:**
```bash
tail -f backend/logs/error.log
```

## If Still Not Working

### Try Incognito/Private Mode

1. Open incognito window
2. Go to http://localhost:5173/admin
3. Login with credentials
4. Test Services tab

If it works in incognito, the issue is browser cache/storage in your regular browser.

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Click Services tab in admin
4. Find the `/api/admin/services` request
5. Click on it
6. Go to "Headers" tab
7. Look for "Authorization" header
8. Should show: `Bearer eyJhbGc...`

### Manual Token Test

You can manually set a fresh token:

1. Login successfully
2. Copy the token from login response
3. In console:
   ```javascript
   localStorage.setItem('auth_token', 'PASTE_TOKEN_HERE');
   ```
4. Refresh page
5. Try Services again

## Why Logout/Login is Required

### Before Fix
```
Login → Generate random token → Store in remember_token field
Frontend → Send token → Backend checks remember_token table
```

### After Fix
```
Login → Generate JWT token → Send to frontend
Frontend → Send JWT → Backend decodes JWT → Validates user
```

**Old tokens from "before fix" are NOT JWT tokens!**  
They're just random strings, so they fail JWT validation.

## Summary

✅ **The Issue:** Old non-JWT token in browser  
✅ **The Solution:** Logout, clear cache, login fresh  
✅ **Why:** Old tokens aren't in JWT format  
✅ **How to Verify:** Check token has 3 parts with dots  

---

**Critical:** You **CANNOT** use an old token with the new system. You **MUST** get a fresh JWT token by logging in again.

**Status:** Waiting for fresh login to generate valid JWT token

