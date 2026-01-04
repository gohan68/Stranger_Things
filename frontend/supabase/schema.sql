-- ============================================
-- STRANGER THINGS: THE RIGHT SIDE UP
-- Database Schema
-- Last Updated: Phase 2 - Initial Creation
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- Purpose: Extended user profile data
-- Links to: auth.users (built-in Supabase table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = TRUE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: comments
-- Purpose: Store chapter comments
-- Features: Anonymous support, moderation flags
-- ============================================

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON public.comments(chapter_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_flagged ON public.comments(is_flagged) WHERE is_flagged = TRUE AND is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: reading_progress
-- Purpose: Sync reading progress across devices
-- Features: Per-user, per-chapter tracking
-- ============================================

CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  scroll_percentage FLOAT NOT NULL CHECK (scroll_percentage >= 0 AND scroll_percentage <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_chapter_id ON public.reading_progress(chapter_id);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_reading_progress_updated_at
  BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- TABLE: newsletter_subscribers
-- Purpose: Newsletter email list with double opt-in
-- Features: Confirmation tokens, unsubscribe tokens
-- ============================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  confirmed BOOLEAN DEFAULT FALSE,
  confirmation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  unsubscribe_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  ip_address INET
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmed ON public.newsletter_subscribers(confirmed) WHERE confirmed = TRUE;
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmation_token ON public.newsletter_subscribers(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribe_token ON public.newsletter_subscribers(unsubscribe_token);

-- ============================================
-- TABLE: comment_flags
-- Purpose: Track flagged comments for moderation
-- Features: User reporting, reason tracking
-- ============================================

CREATE TABLE IF NOT EXISTS public.comment_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  flagged_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, flagged_by_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_flags_comment_id ON public.comment_flags(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_flags_user_id ON public.comment_flags(flagged_by_user_id);

-- ============================================
-- TABLE: rate_limits
-- Purpose: Simple rate limiting storage
-- Features: IP-based and user-based limits
-- ============================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL, -- IP address or user_id
  action_type TEXT NOT NULL, -- 'comment', 'newsletter', etc.
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier, action_type)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);

-- Cleanup old rate limit entries (run daily via cron or manually)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Auto-create profile on user signup
-- Trigger: When new user is created in auth.users
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Auto-flag comment when threshold reached
-- Purpose: Automatically flag comments with 3+ reports
-- ============================================

CREATE OR REPLACE FUNCTION public.auto_flag_comment()
RETURNS TRIGGER AS $$
DECLARE
  flag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO flag_count
  FROM public.comment_flags
  WHERE comment_id = NEW.comment_id;
  
  IF flag_count >= 3 THEN
    UPDATE public.comments
    SET is_flagged = TRUE
    WHERE id = NEW.comment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_flag_comment_trigger
  AFTER INSERT ON public.comment_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_flag_comment();

-- ============================================
-- VIEWS: Helpful views for querying
-- ============================================

-- View: Comments with author information
CREATE OR REPLACE VIEW public.comments_with_authors AS
SELECT 
  c.id,
  c.chapter_id,
  c.content,
  c.is_anonymous,
  c.is_flagged,
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

-- ============================================
-- COMPLETE!
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Anon users need limited access
GRANT SELECT ON public.comments_with_authors TO anon;
GRANT SELECT ON public.profiles TO anon;

COMMENT ON TABLE public.profiles IS 'Extended user profile data linked to auth.users';
COMMENT ON TABLE public.comments IS 'Chapter comments with anonymous support and moderation';
COMMENT ON TABLE public.reading_progress IS 'User reading progress synced across devices';
COMMENT ON TABLE public.newsletter_subscribers IS 'Newsletter subscribers with double opt-in';
COMMENT ON TABLE public.comment_flags IS 'Moderation flags for inappropriate comments';
COMMENT ON TABLE public.rate_limits IS 'Rate limiting for API endpoints';
