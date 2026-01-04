-- ============================================
-- FIX: Grant permissions on views
-- Issue: Views don't inherit RLS policies from base tables
-- Solution: Explicitly grant SELECT on views
-- ============================================

-- Grant SELECT permission on comments_with_authors view to all roles
GRANT SELECT ON public.comments_with_authors TO anon, authenticated;

-- Ensure the view is accessible
-- Note: The view already filters deleted comments, so this is safe
ALTER VIEW public.comments_with_authors OWNER TO postgres;

-- Verify permissions (optional check)
-- You should see 'anon' and 'authenticated' in the grantee list
-- SELECT grantee, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_name='comments_with_authors';

-- ============================================
-- ALTERNATIVE: If view still has issues, recreate with security definer
-- ============================================

-- Drop and recreate the view with SECURITY DEFINER
DROP VIEW IF EXISTS public.comments_with_authors;

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

-- Grant permissions again after recreating
GRANT SELECT ON public.comments_with_authors TO anon, authenticated;

-- ============================================
-- COMPLETE!
-- ============================================
