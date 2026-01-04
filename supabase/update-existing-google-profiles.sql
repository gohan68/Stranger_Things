-- ============================================
-- UPDATE EXISTING GOOGLE PROFILES
-- ============================================
-- This script updates existing user profiles that signed in with Google
-- but don't have their avatar_url or display_name set correctly
--
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- Update profiles where avatar_url is NULL or empty
-- Fetch from auth.users metadata
UPDATE public.profiles p
SET 
  avatar_url = COALESCE(
    (SELECT raw_user_meta_data->>'picture' FROM auth.users WHERE id = p.id),
    (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id = p.id),
    p.avatar_url
  ),
  display_name = COALESCE(
    p.display_name,
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = p.id),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = p.id),
    (SELECT raw_user_meta_data->>'display_name' FROM auth.users WHERE id = p.id)
  ),
  updated_at = NOW()
WHERE 
  p.avatar_url IS NULL 
  OR p.avatar_url = ''
  OR p.display_name IS NULL 
  OR p.display_name = '';

-- Check how many profiles were updated
SELECT 
  COUNT(*) as total_profiles,
  COUNT(avatar_url) as profiles_with_avatar,
  COUNT(*) - COUNT(avatar_url) as profiles_without_avatar
FROM public.profiles;

-- View profiles with their current data
SELECT 
  id,
  display_name,
  avatar_url,
  is_admin,
  updated_at
FROM public.profiles
ORDER BY updated_at DESC
LIMIT 20;
