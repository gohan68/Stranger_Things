# Google Profile Picture Fix - Implementation Guide

## Problem
When users log in with Google OAuth, their profile picture is not displayed in the user menu (top right corner).

## Root Cause Analysis

### Primary Issue: Database Trigger Configuration
The Supabase trigger function `handle_new_user()` that creates user profiles on signup was looking for `avatar_url` in the user metadata, but **Google OAuth provides the profile picture as `picture`**, not `avatar_url`.

**Current trigger (INCORRECT):**
```sql
NEW.raw_user_meta_data->>'avatar_url'  -- This is NULL for Google users!
```

**Should be (CORRECT):**
```sql
COALESCE(
  NEW.raw_user_meta_data->>'picture',      -- Google OAuth
  NEW.raw_user_meta_data->>'avatar_url',   -- Other providers
  NEW.raw_user_meta_data->>'avatar'        -- Alternative field
)
```

### Secondary Issue: Frontend Wasn't Updating Existing Profiles
The frontend code had logic to update profiles with missing avatars, but it wasn't robust enough to handle edge cases like empty strings or whitespace.

## Solutions Implemented

### ✅ Solution 1: Enhanced Frontend Profile Syncing (APPLIED)
**File:** `/app/frontend/contexts/AuthContext.tsx`

**Changes made:**
1. **Improved avatar detection** - Now checks for empty strings and whitespace, not just null/undefined
2. **Added comprehensive logging** - Debug logs to track profile updates
3. **Better error handling** - Catches and logs update errors

**Code updated in `fetchProfile` function:**
```typescript
// More robust checking
const needsAvatarUpdate = (!data.avatar_url || data.avatar_url.trim() === '') && googlePicture;
const needsNameUpdate = (!data.display_name || data.display_name.trim() === '') && googleName;

// Better logging
console.log('Profile data:', { 
  hasAvatar: !!data.avatar_url, 
  hasName: !!data.display_name,
  googlePicture,
  googleName 
});
```

### ✅ Solution 2: Enhanced UserMenu Debugging (APPLIED)
**File:** `/app/frontend/components/auth/UserMenu.tsx`

**Changes made:**
- Added debug logging to track what data is available
- Logs user metadata, profile data, and computed avatar URL

This will help diagnose if the issue is with data fetching or display logic.

### 📋 Solution 3: Fix Supabase Trigger (ACTION REQUIRED)
**File:** `/app/supabase/fix-google-avatar.sql` (Created)

**Status:** ⚠️ **REQUIRES MANUAL EXECUTION IN SUPABASE**

This SQL script updates the database trigger to properly handle Google OAuth avatars.

**How to apply:**
1. Log in to your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the contents of `/app/supabase/fix-google-avatar.sql`
4. Paste and **Run** the SQL script
5. The script includes an optional UPDATE statement to fix existing users

**What the script does:**
- Updates the `handle_new_user()` trigger function to check for multiple avatar field names
- Prioritizes Google's `picture` field
- Falls back to `avatar_url` for other OAuth providers
- Optionally updates existing users who already signed in but don't have avatars

## Testing Instructions

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Sign out and sign in again with Google
4. Look for these logs:

```
✅ "OAuth callback detected, waiting for session..."
✅ "Session status: Active"
✅ "Profile data: { hasAvatar: ..., googlePicture: '...' }"
✅ "Updating profile with Google metadata..."
✅ "Profile updated successfully: { avatar_url: '...' }"
✅ "UserMenu - User data: { avatarUrl: '...', displayName: '...' }"
```

### Step 2: Expected Behavior

**Scenario A: New User (After SQL Fix)**
1. Sign in with Google for the first time
2. Profile should be created WITH avatar immediately
3. Avatar should display in top right corner

**Scenario B: Existing User (Before SQL Fix)**
1. Sign out and sign in again
2. Frontend code will detect missing avatar
3. Profile will be updated with Google picture
4. Avatar should appear after update (might need page refresh)

**Scenario C: Existing User (After SQL Fix + Optional UPDATE)**
1. Avatar should appear immediately on next login
2. No profile update needed

## What to Check If Avatar Still Not Showing

### 1. Check User Metadata
In browser console, type:
```javascript
JSON.stringify(supabase.auth.getUser(), null, 2)
```
Look for `user_metadata.picture` - does it have a URL?

### 2. Check Profile Data
In Supabase dashboard:
1. Go to **Table Editor**
2. Open **profiles** table
3. Find your user row
4. Check if `avatar_url` column has a value

### 3. Check SQL Trigger Status
In Supabase SQL Editor:
```sql
-- Check if the trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check the trigger function
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
```

### 4. Check for CORS/Image Loading Issues
If the avatar URL exists but image doesn't show:
- Open Network tab in DevTools
- Check if the image request is failing (CORS error, 403, 404, etc.)
- Google profile pictures should load without issues as they're publicly accessible

## Immediate Next Steps

### For Quick Fix (No Database Access Needed)
The frontend changes are already applied and will:
1. Automatically update profiles on next login
2. Show debug logs to diagnose the issue
3. Fall back to user metadata if profile isn't updated

**What to do:**
1. Sign out completely
2. Sign in again with Google
3. Check the browser console for logs
4. Avatar should appear (may need page refresh)

### For Permanent Fix (Recommended)
1. **Run the SQL script** in Supabase SQL Editor:
   - File: `/app/supabase/fix-google-avatar.sql`
   - This fixes the root cause so new users get avatars immediately
2. **Uncomment and run the UPDATE statement** to fix existing users
3. **Test with a new Google account** to verify the trigger works

## Files Modified

### Frontend Changes (Applied ✅)
1. `/app/frontend/contexts/AuthContext.tsx`
   - Enhanced profile syncing logic
   - Added debugging logs
   - Better error handling

2. `/app/frontend/components/auth/UserMenu.tsx`
   - Added debug logging
   - Shows what data is available

### Database Changes (Pending ⚠️)
3. `/app/supabase/fix-google-avatar.sql` (Created)
   - SQL script to fix the trigger
   - **Requires manual execution in Supabase**

## Summary

✅ **Immediate Fix Applied:** Frontend will now automatically update profiles with Google avatars
✅ **Debug Logs Added:** You can see what's happening in the browser console
⚠️ **Permanent Fix Pending:** SQL trigger needs to be updated in Supabase dashboard

**Recommendation:** 
1. Test the current fix by signing out and in again
2. If it works, run the SQL script for a permanent solution
3. If it doesn't work, check the debug logs and share them for further troubleshooting
