-- ============================================
-- FIX: Comments View Permissions for Authenticated Users
-- 
-- ISSUE: The comments_with_authors view was only granted to 'anon' role,
--        but not to 'authenticated' role. This causes logged-in users
--        to see loading skeletons that never resolve (no data returned).
--
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ============================================

-- Grant SELECT on the comments_with_authors view to authenticated users
GRANT SELECT ON public.comments_with_authors TO authenticated;

-- Also ensure the view has proper security context
-- Using SECURITY INVOKER means the view respects the caller's permissions
-- This should already be the default, but we make it explicit
CREATE OR REPLACE VIEW public.comments_with_authors
WITH (security_invoker = true)
AS
SELECT 
  c.id,
  c.chapter_id,
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
ORDER BY c.created_at ASC;

-- Re-apply grants after recreating the view
GRANT SELECT ON public.comments_with_authors TO anon;
GRANT SELECT ON public.comments_with_authors TO authenticated;

-- Verify the grants are applied (you can run this to check)
-- SELECT grantee, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_name = 'comments_with_authors';

-- ============================================
-- After running this script, refresh your page
-- and the comments should load for logged-in users.
-- ============================================
