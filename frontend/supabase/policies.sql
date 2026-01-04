-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Purpose: Secure data access at database level
-- Last Updated: Phase 2 - Initial Creation
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Anyone can view profiles (for comment author display)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile (for is_admin flag)
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- COMMENTS POLICIES
-- ============================================

-- Anyone can view non-deleted comments
CREATE POLICY "Comments are viewable by everyone"
  ON public.comments
  FOR SELECT
  USING (is_deleted = FALSE);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_anonymous = TRUE);

-- Anonymous users can insert anonymous comments
CREATE POLICY "Anonymous users can insert anonymous comments"
  ON public.comments
  FOR INSERT
  TO anon
  WITH CHECK (is_anonymous = TRUE AND user_id IS NULL);

-- Users can update their own comments (within 15 minutes)
CREATE POLICY "Users can update their own recent comments"
  ON public.comments
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND created_at > NOW() - INTERVAL '15 minutes'
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can soft-delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update/delete any comment
CREATE POLICY "Admins can manage all comments"
  ON public.comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- READING PROGRESS POLICIES
-- ============================================

-- Users can only view their own progress
CREATE POLICY "Users can view their own progress"
  ON public.reading_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own progress"
  ON public.reading_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress"
  ON public.reading_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own progress
CREATE POLICY "Users can delete their own progress"
  ON public.reading_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- NEWSLETTER SUBSCRIBERS POLICIES
-- ============================================

-- Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view subscriber list
CREATE POLICY "Admins can view all subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- System can update confirmation status (via service role)
CREATE POLICY "Service role can update subscribers"
  ON public.newsletter_subscribers
  FOR UPDATE
  USING (true);

-- Subscribers can delete themselves (unsubscribe)
CREATE POLICY "Anyone can unsubscribe"
  ON public.newsletter_subscribers
  FOR DELETE
  USING (true);

-- ============================================
-- COMMENT FLAGS POLICIES
-- ============================================

-- Authenticated users can flag comments
CREATE POLICY "Authenticated users can flag comments"
  ON public.comment_flags
  FOR INSERT
  WITH CHECK (auth.uid() = flagged_by_user_id);

-- Users can view their own flags
CREATE POLICY "Users can view their own flags"
  ON public.comment_flags
  FOR SELECT
  USING (auth.uid() = flagged_by_user_id);

-- Admins can view all flags
CREATE POLICY "Admins can view all flags"
  ON public.comment_flags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- Admins can delete flags (resolve)
CREATE POLICY "Admins can delete flags"
  ON public.comment_flags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = TRUE
    )
  );

-- ============================================
-- RATE LIMITS POLICIES
-- ============================================

-- Service role manages rate limits
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits
  FOR ALL
  USING (true);

-- Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
  ON public.rate_limits
  FOR SELECT
  USING (identifier = auth.uid()::text);

-- ============================================
-- SECURITY FUNCTIONS
-- Helper functions for checking permissions
-- ============================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user owns a comment
CREATE OR REPLACE FUNCTION public.owns_comment(comment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.comments
    WHERE id = comment_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's comment count in last hour (for rate limiting)
CREATE OR REPLACE FUNCTION public.user_comment_count_last_hour()
RETURNS INTEGER AS $$
DECLARE
  comment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO comment_count
  FROM public.comments
  WHERE user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '1 hour';
  
  RETURN comment_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMPLETE!
-- All RLS policies are now active
-- ============================================

COMMENT ON POLICY "Profiles are viewable by everyone" ON public.profiles IS 'Public profiles for comment attribution';
COMMENT ON POLICY "Comments are viewable by everyone" ON public.comments IS 'Public reading of non-deleted comments';
COMMENT ON POLICY "Users can view their own progress" ON public.reading_progress IS 'Private reading progress per user';
COMMENT ON POLICY "Admins can view all subscribers" ON public.newsletter_subscribers IS 'Newsletter admin access only';
COMMENT ON POLICY "Authenticated users can flag comments" ON public.comment_flags IS 'User-driven moderation system';
