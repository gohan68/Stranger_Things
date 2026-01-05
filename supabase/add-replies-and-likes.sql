-- ============================================
-- MIGRATION: Add Replies and Likes to Comments
-- 
-- This migration adds:
-- 1. parent_id column to comments for threading (replies)
-- 2. comment_likes table for tracking likes
-- 3. Updated comments_with_authors view with like_count and parent_id
-- 
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ============================================

-- 1. Add parent_id column to comments for threading
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. Add index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id) WHERE parent_id IS NOT NULL;

-- ============================================
-- TABLE: comment_likes
-- Purpose: Track likes on comments
-- Features: One like per user per comment
-- ============================================

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES for comment_likes
-- ============================================

-- Anyone can view likes (to show like counts)
CREATE POLICY "Likes are viewable by everyone"
  ON public.comment_likes
  FOR SELECT
  USING (true);

-- Authenticated users can like comments
CREATE POLICY "Users can like comments"
  ON public.comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only unlike their own likes
CREATE POLICY "Users can unlike their own likes"
  ON public.comment_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.comment_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;

-- ============================================
-- UPDATE: comments_with_authors view
-- Add parent_id and like_count columns
-- ============================================

DROP VIEW IF EXISTS public.comments_with_authors;

CREATE OR REPLACE VIEW public.comments_with_authors AS
SELECT 
  c.id,
  c.chapter_id,
  c.content,
  c.is_anonymous,
  c.is_flagged,
  c.is_deleted,
  c.created_at,
  c.updated_at,
  c.user_id,
  c.parent_id,
  CASE 
    WHEN c.is_anonymous THEN 'Anonymous'
    ELSE COALESCE(p.display_name, 'User')
  END as author_name,
  CASE 
    WHEN c.is_anonymous THEN NULL
    ELSE p.avatar_url
  END as author_avatar,
  (SELECT COUNT(*) FROM public.comment_flags WHERE comment_id = c.id) as flag_count,
  (SELECT COUNT(*) FROM public.comment_likes WHERE comment_id = c.id) as like_count
FROM public.comments c
LEFT JOIN public.profiles p ON c.user_id = p.id
WHERE c.is_deleted = FALSE;

-- Grant permissions on the view
GRANT SELECT ON public.comments_with_authors TO anon;
GRANT SELECT ON public.comments_with_authors TO authenticated;

-- ============================================
-- After running this script:
-- 1. Refresh your app
-- 2. Comments will now support replies and likes
-- ============================================
