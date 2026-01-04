# Troubleshooting Guide

**Project**: Stranger Things - The Right Side Up  
**Last Updated**: Phase 8 - Integration & Polish

---

## 🔍 Common Issues & Solutions

### Authentication Issues

#### Problem: "Google OAuth is not configured" error
**Symptoms**: Error message when clicking "Sign in with Google"

**Solutions**:
1. Verify Google OAuth is enabled in Supabase:
   - Go to Supabase Dashboard → Authentication → Providers
   - Enable Google provider
   - Add Google Client ID and Secret

2. Configure redirect URLs:
   - In Google Cloud Console: Add `https://your-project.supabase.co/auth/v1/callback`
   - In Supabase: Add your site URL in Authentication → URL Configuration

3. Check environment variables:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_secret
   ```

---

#### Problem: Session not persisting after refresh
**Symptoms**: User gets logged out on page refresh

**Solutions**:
1. Check Supabase client configuration in `/app/lib/supabase.ts`:
   ```typescript
   auth: {
     autoRefreshToken: true,
     persistSession: true,
     detectSessionInUrl: true
   }
   ```

2. Clear browser cookies and localStorage
3. Check browser console for errors
4. Verify Supabase project is not paused

---

### Comment System Issues

#### Problem: Comments not appearing
**Symptoms**: Comments don't load, empty state shows

**Solutions**:
1. Check if comments feature is enabled:
   ```env
   VITE_ENABLE_COMMENTS=true
   ```

2. Verify Supabase connection:
   ```javascript
   // Check browser console for errors
   // Should not see "Missing Supabase environment variables"
   ```

3. Check RLS policies in Supabase:
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM comments WHERE chapter_id = 'chapter-1';
   ```

4. Verify `comments_with_authors` view exists:
   ```sql
   SELECT * FROM comments_with_authors LIMIT 1;
   ```

---

#### Problem: "Rate limit exceeded" error
**Symptoms**: Cannot post comments, rate limit error

**Solutions**:
1. Wait 1 hour (default rate limit window)
2. Clear localStorage:
   ```javascript
   localStorage.removeItem('comment_rate_limit_*')
   ```
3. Adjust rate limit in `.env`:
   ```env
   RATE_LIMIT_COMMENTS=20  # Increase from 10
   ```

---

#### Problem: Real-time updates not working
**Symptoms**: New comments don't appear automatically

**Solutions**:
1. Check Supabase Realtime is enabled:
   - Supabase Dashboard → Database → Replication
   - Enable replication for `comments` table

2. Verify network connection (WebSocket)
3. Check browser console for WebSocket errors
4. Manually refresh to see new comments

---

### Reading Progress Issues

#### Problem: Progress not syncing across devices
**Symptoms**: Different scroll positions on different devices

**Solutions**:
1. Verify user is authenticated (progress sync requires login)
2. Check feature flag:
   ```env
   VITE_ENABLE_PROGRESS_SYNC=true
   ```

3. Check Supabase `reading_progress` table:
   ```sql
   SELECT * FROM reading_progress WHERE user_id = 'your-user-id';
   ```

4. Clear localStorage and re-login to trigger sync

---

#### Problem: Progress not saving at all
**Symptoms**: Always starts from beginning of chapter

**Solutions**:
1. For authenticated users:
   - Check Supabase connection
   - Verify RLS policies on `reading_progress` table
   - Check browser console for errors

2. For guest users:
   - Check localStorage is enabled in browser
   - Look for `chapterScrollPositions` in localStorage
   - Try different browser if issue persists

---

### Admin Dashboard Issues

#### Problem: Cannot access admin dashboard
**Symptoms**: Redirects to home page or 404

**Solutions**:
1. Verify admin route exists in `/app/App.tsx`:
   ```typescript
   <Route path="/admin" element={<AdminDashboard />} />
   ```

2. Check user has admin privileges:
   ```sql
   -- In Supabase SQL Editor
   SELECT id, display_name, is_admin FROM profiles WHERE id = 'your-user-id';
   ```

3. Set `is_admin = true` for your user:
   ```sql
   UPDATE profiles SET is_admin = true WHERE id = 'your-user-id';
   ```

4. Check environment variable (if using):
   ```env
   VITE_ADMIN_USER_IDS=uuid1,uuid2
   ```

---

#### Problem: Flagged comments not showing
**Symptoms**: Admin dashboard shows 0 flagged comments

**Solutions**:
1. Verify comments have been flagged:
   ```sql
   SELECT * FROM comment_flags;
   ```

2. Check `comments_with_authors` view includes flag count
3. Verify RLS policies allow admin to read flagged comments

---

### Performance Issues

#### Problem: Slow initial load
**Symptoms**: White screen for 2-3 seconds

**Solutions**:
1. Enable code splitting (already implemented for admin)
2. Check network speed and Supabase region
3. Optimize images and assets
4. Use production build: `yarn build && yarn preview`

---

#### Problem: Laggy scrolling in Reader
**Symptoms**: Choppy scrolling experience

**Solutions**:
1. Check browser DevTools Performance tab
2. Reduce reading progress save frequency (currently 5s)
3. Disable browser extensions
4. Clear browser cache

---

### Database Issues

#### Problem: "Invalid API key" error
**Symptoms**: All Supabase operations fail

**Solutions**:
1. Verify environment variables are set:
   ```bash
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. Check `.env` file exists and is loaded
3. Restart development server after changing `.env`
4. Verify keys match Supabase Dashboard → Settings → API

---

#### Problem: RLS policy blocks queries
**Symptoms**: "row-level security policy violation" errors

**Solutions**:
1. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
   ```

2. Check policy definitions:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'comments';
   ```

3. Re-run policies.sql if needed
4. Verify user authentication state

---

### Build & Deployment Issues

#### Problem: Build fails with TypeScript errors
**Symptoms**: `yarn build` fails

**Solutions**:
1. Check TypeScript version:
   ```bash
   yarn list typescript
   ```

2. Clear cache and reinstall:
   ```bash
   rm -rf node_modules yarn.lock
   yarn install
   ```

3. Check for type errors:
   ```bash
   yarn tsc --noEmit
   ```

---

#### Problem: Environment variables not working in production
**Symptoms**: Features work locally but not deployed

**Solutions**:
1. Verify `VITE_` prefix for client-side variables
2. Set environment variables in deployment platform (Vercel/Netlify)
3. Rebuild and redeploy after setting variables
4. Check build logs for warnings

---

#### Problem: PDF download fails in production
**Symptoms**: 404 error when downloading PDF

**Solutions**:
1. Verify PDF is in `/public` directory
2. Check file name matches code: `stranger-things-the-right-side-up.pdf`
3. Ensure file is included in build output (`dist` folder)
4. Test direct URL: `https://your-domain.com/stranger-things-the-right-side-up.pdf`

---

### Browser-Specific Issues

#### Problem: Issues in Safari
**Symptoms**: Features work in Chrome but not Safari

**Solutions**:
1. Check Safari version (needs modern JavaScript support)
2. Enable "Disable Cross-Origin Restrictions" for local dev
3. Check console for specific errors
4. Test in Safari Technology Preview

---

#### Problem: Issues in mobile browsers
**Symptoms**: Different behavior on mobile vs desktop

**Solutions**:
1. Test responsive design in DevTools mobile view
2. Check touch events work correctly
3. Verify viewport meta tag in `index.html`
4. Test on actual device, not just emulator

---

## 🔧 Development Tools

### Useful Browser DevTools Commands

```javascript
// Check Supabase connection
console.log(supabase)

// View current user
console.log(await supabase.auth.getUser())

// Check localStorage
console.log(localStorage)

// Check environment variables
console.log(import.meta.env)

// Force re-render comments
window.location.reload()
```

### Useful SQL Queries

```sql
-- Check all comments for a chapter
SELECT * FROM comments_with_authors WHERE chapter_id = 'chapter-1';

-- Check user profile
SELECT * FROM profiles WHERE id = 'user-uuid';

-- Check reading progress
SELECT * FROM reading_progress WHERE user_id = 'user-uuid';

-- Check flagged comments
SELECT c.*, cf.reason 
FROM comments c 
JOIN comment_flags cf ON c.id = cf.comment_id;

-- Make user admin
UPDATE profiles SET is_admin = true WHERE id = 'user-uuid';
```

---

## 🆘 Getting Help

### Check Logs

**Development**:
```bash
# Browser console logs
# Check Network tab for failed requests
# Check Supabase logs in Dashboard
```

**Production**:
```bash
# Vercel: vercel logs
# Netlify: Check deploy logs in dashboard
# Supabase: Check logs in Dashboard → Logs
```

### Debug Mode

Enable verbose logging:
```javascript
// In browser console
localStorage.setItem('debug', 'supabase:*')
```

### Still Having Issues?

1. Check [Supabase Status](https://status.supabase.com/)
2. Review Supabase documentation
3. Check browser console for specific errors
4. Test with a fresh browser profile (no extensions)
5. Try incognito/private browsing mode

---

## 📋 Checklist for Issues

Before reporting an issue, verify:

- [ ] Environment variables are set correctly
- [ ] Supabase project is active (not paused)
- [ ] Database migrations have been run
- [ ] RLS policies are enabled
- [ ] User has correct permissions
- [ ] Browser cache cleared
- [ ] Using latest code version
- [ ] Tested in multiple browsers
- [ ] Checked browser console for errors
- [ ] Checked network tab for failed requests

---

**Related Documentation**:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_REFERENCE.md](./API_REFERENCE.md) - API documentation
