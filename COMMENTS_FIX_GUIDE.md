# 🔧 Comments Not Loading - Troubleshooting Guide

## Issue: "Failed to load comments" Error

Since your database tables exist but comments aren't loading, this is most likely a **Row Level Security (RLS) permissions issue**.

---

## 🎯 Quick Fix (Run this SQL in Supabase)

### Step 1: Go to Supabase SQL Editor
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Permission Fix

Copy and paste this entire SQL code, then click **Run**:

```sql
-- Grant SELECT permission on the view to all users
GRANT SELECT ON public.comments_with_authors TO anon, authenticated;

-- Recreate the view with proper security settings
DROP VIEW IF EXISTS public.comments_with_authors CASCADE;

CREATE VIEW public.comments_with_authors 
WITH (security_invoker = false) AS
SELECT 
  c.id,
  c.chapter_id,
  c.user_id,
  c.content,
  c.is_anonymous,
  c.is_flagged,
  c.is_deleted,
  c.created_at,
  c.updated_at,
  CASE 
    WHEN c.is_anonymous THEN 'Anonymous'
    ELSE COALESCE(p.display_name, 'User')
  END as author_name,
  CASE 
    WHEN c.is_anonymous THEN NULL
    ELSE p.avatar_url
  END as author_avatar,
  (SELECT COUNT(*) FROM public.comment_flags WHERE comment_id = c.id) as flag_count
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
WHERE c.is_deleted = FALSE
ORDER BY c.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.comments_with_authors TO anon, authenticated;
```

### Step 3: Verify the Fix
1. Refresh your web app
2. Navigate to any chapter
3. Scroll to comments section
4. Should now show either:
   - "No comments yet" (if no comments exist) ✅
   - Existing comments (if any exist) ✅

---

## 🔍 How to Verify It Worked

### Check in Browser Console (F12)
After running the SQL fix:

1. Open browser developer console (F12)
2. Reload the page
3. Check for:
   - ❌ **Before Fix**: `permission denied` or `policy` errors
   - ✅ **After Fix**: No Supabase errors, or just empty array logs

### Test Comments Feature
1. **Sign in** with Google (click "Sign In" button)
2. Navigate to any chapter
3. Scroll to bottom
4. Try posting a test comment
5. Should work! 🎉

---

## 🐛 Still Not Working? Additional Checks

### Check 1: Verify Tables Have RLS Enabled
Run this query in SQL Editor:

```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('comments', 'profiles');
```

**Expected**: Both should show `rowsecurity = true`

### Check 2: Verify View Exists
```sql
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'comments_with_authors';
```

**Expected**: Should return 1 row with `table_type = VIEW`

### Check 3: Test Direct Query
```sql
SELECT * FROM public.comments_with_authors LIMIT 5;
```

**Expected**: Should return data or empty result (not permission error)

### Check 4: Check View Permissions
```sql
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'comments_with_authors';
```

**Expected**: Should include rows with:
- `grantee = 'anon'` and `privilege_type = 'SELECT'`
- `grantee = 'authenticated'` and `privilege_type = 'SELECT'`

---

## 🔒 Understanding the Issue

### What Happened?
- Your `comments` table has RLS policies that allow SELECT for everyone
- BUT the `comments_with_authors` VIEW doesn't automatically inherit those permissions
- Views need explicit `GRANT SELECT` commands
- Without them, the view shows as "restricted" in Table Editor

### Why This Matters
- The app queries `comments_with_authors` (not `comments` directly)
- This view joins comments with profile data
- It needs separate permissions from the base table

---

## 📋 Alternative: Query Base Table Directly

If the view fix doesn't work, we can modify the app to query the base table instead:

**Let me know if you need this alternative approach!**

---

## ✅ After Fix Checklist

- [ ] Run the permission fix SQL
- [ ] See "Success" message in SQL Editor
- [ ] Refresh your web app
- [ ] Check browser console - no permission errors
- [ ] Try posting a comment (after signing in)
- [ ] Comments should load and display properly

---

## 🎯 Root Cause Summary

**Problem**: `comments_with_authors` view lacked explicit SELECT permissions for `anon` and `authenticated` roles

**Solution**: Grant SELECT permissions explicitly on the view

**Prevention**: Always run `GRANT SELECT` on views after creating them in Supabase

---

## 📞 Need More Help?

If after running the fix you still see errors:

1. **Share the exact error** from browser console (F12 → Console tab)
2. **Check Supabase logs**: Dashboard → Logs → SQL logs
3. **Verify auth status**: Are you signed in or browsing as guest?

The fix SQL is also saved at: `/app/supabase/fix-view-permissions.sql`

---

**Last Updated**: Now  
**Status**: Fix ready to apply  
**Estimated Time**: 2 minutes
