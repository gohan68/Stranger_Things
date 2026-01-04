# 🛡️ Admin Panel Access Guide

## Overview

Your app has a built-in admin dashboard for moderating comments at `/admin` route. Here's how to access it:

---

## 🔐 How Admin Access Works

The admin panel checks if you have the `is_admin` flag set to `true` in your Supabase profile. Here's the full flow:

1. **Sign in** with Google OAuth
2. Your **profile** is created in Supabase
3. Your profile has an `is_admin` field (default: `false`)
4. You need to **manually set** `is_admin = true` in the database
5. Once set, you can access `/admin`

---

## 📋 Step-by-Step Setup

### Step 1: Sign In to Your App

1. Open your app in the browser
2. Click **"Sign In"** button (top right)
3. Sign in with Google
4. You'll be redirected back to the app

### Step 2: Get Your User ID

**Option A - Browser Console (Easiest)**
1. After signing in, open browser console (F12)
2. Paste this and press Enter:
```javascript
supabase.auth.getUser().then(({data}) => {
  console.log("YOUR USER ID:", data.user.id);
  console.log("Copy this ID:", data.user.id);
});
```
3. Copy the UUID that appears

**Option B - Supabase Dashboard**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Authentication** → **Users**
4. Find your email in the list
5. Copy the **ID** (UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 3: Set Admin Flag in Database

Go to **Supabase SQL Editor** and run:

```sql
-- Replace 'YOUR-USER-ID-HERE' with your actual UUID from Step 2
UPDATE public.profiles
SET is_admin = true
WHERE id = 'YOUR-USER-ID-HERE';

-- Verify it worked
SELECT id, display_name, is_admin 
FROM public.profiles 
WHERE id = 'YOUR-USER-ID-HERE';
```

**Expected Result**: Should show your profile with `is_admin = true`

### Step 4: Reload and Access Admin Panel

1. **Refresh your browser** (to reload your profile data)
2. Navigate to: `http://localhost:3000/#/admin`
3. You should see the Admin Dashboard! 🎉

---

## 🎯 Admin Panel URL

**Development**: `http://localhost:3000/#/admin`  
**Production**: `https://yourdomain.com/#/admin`

**Note**: The `#` is important (HashRouter)

---

## 🛠️ Admin Features

Once you access the admin panel, you can:

### 1. View Flagged Comments
- See all comments that users have reported
- Shows flag count for each comment
- Displays comment content and metadata

### 2. Moderate Comments
- **Approve**: Remove flags and mark as safe
- **Delete**: Permanently remove inappropriate comments
- Both actions update in real-time

### 3. Monitor Activity
- See chapter IDs where comments were posted
- View timestamps
- Track comment authors

---

## 🔒 Security Features

### Access Control
- ✅ Only users with `is_admin = true` can access
- ✅ Non-admins are automatically redirected to home page
- ✅ Protected by Row Level Security (RLS) in database

### Database Policies
```sql
-- Admins can manage all comments
CREATE POLICY "Admins can manage all comments"
  ON public.comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );
```

---

## 🐛 Troubleshooting

### "I can't see the admin panel"

**Problem**: Redirected to home page after going to `/admin`

**Solutions**:
1. ✅ Check you're signed in (see user icon top-right)
2. ✅ Verify `is_admin = true` in database:
```sql
SELECT * FROM public.profiles WHERE id = auth.uid();
```
3. ✅ Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
4. ✅ Clear browser cache and sign in again

### "No flagged comments showing"

**This is normal!** Comments only appear when:
- Users flag them (3+ flags auto-flag)
- Or you manually flag them in database

**To test the admin panel**:
```sql
-- Manually flag a comment for testing
UPDATE public.comments
SET is_flagged = true
WHERE id = (SELECT id FROM public.comments LIMIT 1);
```

### "Getting permission errors"

Run the view permissions fix from the previous guide:
```sql
GRANT SELECT ON public.comments_with_authors TO authenticated;
```

---

## 👥 Adding Multiple Admins

To make other users admins:

1. Have them sign in to your app
2. Get their User ID (same process as Step 2 above)
3. Run this SQL:
```sql
UPDATE public.profiles
SET is_admin = true
WHERE id = 'THEIR-USER-ID-HERE';
```

---

## 📊 Admin Panel Features Breakdown

| Feature | Status | Description |
|---------|--------|-------------|
| View Flagged Comments | ✅ Working | See all reported comments |
| Approve Comments | ✅ Working | Remove flags, mark as safe |
| Delete Comments | ✅ Working | Soft-delete inappropriate content |
| Real-time Updates | ✅ Working | Auto-refresh on actions |
| User Info Display | ✅ Working | Shows author & timestamps |
| Bulk Actions | ❌ Not implemented | Future enhancement |
| Ban Users | ❌ Not implemented | Future enhancement |

---

## 🔧 Quick Setup Script

Run this in Supabase SQL Editor (all in one go):

```sql
-- 1. Get your user ID
SELECT id, email, display_name 
FROM public.profiles 
WHERE id = auth.uid();

-- 2. Make yourself admin (after noting your ID from above)
UPDATE public.profiles
SET is_admin = true
WHERE id = auth.uid();

-- 3. Verify admin status
SELECT id, display_name, is_admin, created_at
FROM public.profiles
WHERE is_admin = true;
```

---

## 🎨 Admin Panel Preview

When you access `/admin`, you'll see:

```
┌─────────────────────────────────────────┐
│ 🛡️ Admin Dashboard                      │
│ Manage flagged comments and moderate    │
├─────────────────────────────────────────┤
│                                         │
│ 🚩 Flagged Comments (3)    [Refresh]   │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ User123    [2 flags]                │ │
│ │ Chapter: ch-1 • 2 hours ago         │ │
│ │                                     │ │
│ │ "Comment content here..."           │ │
│ │                                     │ │
│ │      [Approve]    [Delete]          │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📝 Summary Checklist

- [ ] Sign in with Google
- [ ] Get your User ID (console or Supabase dashboard)
- [ ] Run SQL to set `is_admin = true`
- [ ] Refresh browser
- [ ] Navigate to `/#/admin`
- [ ] Access granted! 🎉

---

## 🚀 Quick Commands

**Get your user ID:**
```javascript
// In browser console after signing in
supabase.auth.getUser().then(({data}) => console.log(data.user.id));
```

**Make yourself admin:**
```sql
-- In Supabase SQL Editor
UPDATE public.profiles SET is_admin = true WHERE id = auth.uid();
```

**Verify admin access:**
```sql
SELECT * FROM public.profiles WHERE id = auth.uid();
```

---

**Need Help?** Check the browser console (F12) for any errors after trying to access `/admin`.

**Last Updated**: Now  
**Admin Route**: `/#/admin`  
**Auth Required**: Yes (Google OAuth)
