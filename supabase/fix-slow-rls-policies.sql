-- ============================================
-- FIX: Slow RLS Policies for Authenticated Users
-- 
-- ISSUE: The "Admins can manage all comments" policy uses FOR ALL,
--        which means it runs an EXISTS subquery on the profiles table
--        for EVERY operation including SELECT. This causes slow queries
--        for authenticated users.
--
-- SOLUTION: This script fixes the policies by:
-- 1. Dropping the problematic ALL policy
-- 2. Creating separate policies for UPDATE and DELETE (not SELECT)
-- 
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ============================================

-- First, drop the problematic policy that causes slow SELECT queries
DROP POLICY IF EXISTS "Admins can manage all comments" ON public.comments;

-- Create admin policy for UPDATE only (not SELECT)
CREATE POLICY "Admins can update any comment"
  ON public.comments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Create admin policy for DELETE only (not SELECT)
CREATE POLICY "Admins can delete any comment"
  ON public.comments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Verify the "Comments are viewable by everyone" SELECT policy exists
-- This policy should allow anyone to read non-deleted comments
-- If it doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' 
    AND policyname = 'Comments are viewable by everyone'
  ) THEN
    EXECUTE 'CREATE POLICY "Comments are viewable by everyone"
      ON public.comments
      FOR SELECT
      USING (is_deleted = FALSE)';
  END IF;
END $$;

-- Also ensure the view has proper grants
GRANT SELECT ON public.comments_with_authors TO authenticated;
GRANT SELECT ON public.comments_with_authors TO anon;
GRANT SELECT ON public.comments TO authenticated;
GRANT SELECT ON public.comments TO anon;

-- ============================================
-- After running this script:
-- 1. Refresh your app
-- 2. Comments should now load for authenticated users
-- ============================================
