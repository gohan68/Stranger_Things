-- ============================================
-- FIX: Google Profile Picture Not Showing
-- ============================================
-- This SQL script fixes the issue where Google OAuth profile pictures
-- are not being saved to user profiles.
--
-- ISSUE: The trigger was looking for 'avatar_url' in metadata,
-- but Google OAuth provides it as 'picture'
--
-- RUN THIS IN SUPABASE SQL EDITOR
-- ============================================

-- Update the handle_new_user function to support Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    -- Try multiple sources for display name
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    -- Try multiple sources for avatar (Google uses 'picture', others use 'avatar_url')
    COALESCE(
      NEW.raw_user_meta_data->>'picture',      -- Google OAuth
      NEW.raw_user_meta_data->>'avatar_url',   -- Other providers
      NEW.raw_user_meta_data->>'avatar'        -- Alternative field
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- OPTIONAL: Update existing users who signed in with Google
-- but don't have their avatar set
-- ============================================
-- Uncomment and run this to fix existing users:

/*
UPDATE public.profiles p
SET 
  avatar_url = COALESCE(
    (SELECT raw_user_meta_data->>'picture' FROM auth.users WHERE id = p.id),
    (SELECT raw_user_meta_data->>'avatar_url' FROM auth.users WHERE id = p.id)
  ),
  display_name = COALESCE(
    p.display_name,
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = p.id),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = p.id)
  )
WHERE avatar_url IS NULL OR display_name IS NULL;
*/
