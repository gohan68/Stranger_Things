-- ============================================
-- SEED DATA FOR TESTING
-- Purpose: Sample data to test functionality
-- Last Updated: Phase 2 - Initial Creation
-- WARNING: Only run in development/testing!
-- ============================================

-- Note: You'll need to insert actual user IDs after creating test accounts
-- This file provides the structure and example data

-- ============================================
-- SAMPLE PROFILES
-- ============================================
-- These will be auto-created when users sign up via Supabase Auth
-- But you can manually insert test profiles like this:

-- INSERT INTO public.profiles (id, display_name, avatar_url, is_admin)
-- VALUES 
--   ('YOUR-USER-UUID-HERE', 'Test Admin', 'https://avatar.vercel.sh/admin.png', TRUE),
--   ('ANOTHER-UUID', 'Test User', 'https://avatar.vercel.sh/user.png', FALSE);

-- ============================================
-- SAMPLE COMMENTS
-- ============================================

-- First, you need actual user IDs from auth.users
-- After signing up test users, run:
-- SELECT id, email FROM auth.users;
-- Then replace the UUIDs below

/*
INSERT INTO public.comments (chapter_id, user_id, content, is_anonymous, created_at)
VALUES 
  -- Chapter 1 comments
  ('ch1', 'YOUR-USER-UUID', 'This opening chapter gave me chills! The way you described the dimension collapsing was incredible.', FALSE, NOW() - INTERVAL '2 days'),
  ('ch1', NULL, 'Anonymous reader here - just wanted to say this is amazing! Thank you for writing this.', TRUE, NOW() - INTERVAL '1 day'),
  ('ch1', 'ANOTHER-UUID', 'The emotion in Eleven''s final stand... I''m not crying, you''re crying 😭', FALSE, NOW() - INTERVAL '12 hours'),
  
  -- Chapter 2 comments
  ('ch2', 'YOUR-USER-UUID', 'Dr. Kay is such a perfect villain. Cold, calculating, but ultimately defeated by simple humanity.', FALSE, NOW() - INTERVAL '1 day'),
  ('ch2', NULL, 'Dr. Owens coming back to save the kids was so satisfying!', TRUE, NOW() - INTERVAL '6 hours'),
  
  -- Chapter 3 comments
  ('ch3', 'ANOTHER-UUID', 'The D&D scene made me so happy. After everything they''ve been through, they deserve this peace.', FALSE, NOW() - INTERVAL '3 hours'),
  ('ch3', 'YOUR-USER-UUID', 'Joyce and Hopper as parents to El is everything I needed.', FALSE, NOW() - INTERVAL '1 hour'),
  
  -- Epilogue comments
  ('epilogue', NULL, 'I''m literally sobbing. This is the ending we deserved. Thank you. ❤️', TRUE, NOW() - INTERVAL '30 minutes'),
  ('epilogue', 'ANOTHER-UUID', 'To the right side up. Perfect. Absolutely perfect.', FALSE, NOW() - INTERVAL '15 minutes');
*/

-- ============================================
-- SAMPLE READING PROGRESS
-- ============================================

/*
INSERT INTO public.reading_progress (user_id, chapter_id, scroll_percentage, updated_at)
VALUES 
  ('YOUR-USER-UUID', 'ch1', 100, NOW() - INTERVAL '2 days'),
  ('YOUR-USER-UUID', 'ch2', 100, NOW() - INTERVAL '1 day'),
  ('YOUR-USER-UUID', 'ch3', 75, NOW() - INTERVAL '3 hours'),
  ('ANOTHER-UUID', 'ch1', 100, NOW() - INTERVAL '1 day'),
  ('ANOTHER-UUID', 'ch2', 50, NOW() - INTERVAL '12 hours');
*/

-- ============================================
-- SAMPLE NEWSLETTER SUBSCRIBERS
-- ============================================

INSERT INTO public.newsletter_subscribers (email, confirmed, confirmed_at)
VALUES 
  ('test1@example.com', TRUE, NOW() - INTERVAL '5 days'),
  ('test2@example.com', TRUE, NOW() - INTERVAL '3 days'),
  ('test3@example.com', FALSE, NULL),
  ('test4@example.com', TRUE, NOW() - INTERVAL '1 day')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- SAMPLE FLAGGED COMMENT
-- ============================================
-- Example of a comment that should be flagged

/*
-- First insert a problematic comment
INSERT INTO public.comments (id, chapter_id, user_id, content, is_anonymous, is_flagged)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'ch1', NULL, 'This is spam! Click here for free stuff!', TRUE, FALSE);

-- Then add flags from different users (3+ flags will auto-flag)
INSERT INTO public.comment_flags (comment_id, flagged_by_user_id, reason)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'YOUR-USER-UUID', 'Spam'),
  ('00000000-0000-0000-0000-000000000001', 'ANOTHER-UUID', 'Inappropriate content'),
  ('00000000-0000-0000-0000-000000000001', 'THIRD-UUID', 'Spam');
-- After 3rd flag, the comment should be auto-flagged (is_flagged = TRUE)
*/

-- ============================================
-- USEFUL QUERIES FOR TESTING
-- ============================================

-- View all comments with author names
-- SELECT * FROM public.comments_with_authors;

-- Count comments per chapter
-- SELECT chapter_id, COUNT(*) as comment_count 
-- FROM public.comments 
-- WHERE is_deleted = FALSE 
-- GROUP BY chapter_id 
-- ORDER BY comment_count DESC;

-- View flagged comments
-- SELECT c.*, COUNT(cf.id) as flag_count
-- FROM public.comments c
-- LEFT JOIN public.comment_flags cf ON c.id = cf.comment_id
-- WHERE c.is_flagged = TRUE
-- GROUP BY c.id;

-- View confirmed newsletter subscribers
-- SELECT email, confirmed_at 
-- FROM public.newsletter_subscribers 
-- WHERE confirmed = TRUE 
-- ORDER BY confirmed_at DESC;

-- Check reading progress for a user
-- SELECT chapter_id, scroll_percentage, updated_at 
-- FROM public.reading_progress 
-- WHERE user_id = 'YOUR-USER-UUID' 
-- ORDER BY updated_at DESC;

-- ============================================
-- HOW TO USE THIS FILE
-- ============================================

-- 1. First, run schema.sql to create all tables
-- 2. Then, run policies.sql to set up security
-- 3. Create test users via Supabase Auth UI or API
-- 4. Get their user IDs: SELECT id, email FROM auth.users;
-- 5. Uncomment sections above and replace UUIDs
-- 6. Run this file to populate test data
-- 7. Test your app with real-looking data!

-- ============================================
-- CLEANUP (if needed)
-- ============================================

-- To remove all test data:
-- DELETE FROM public.comment_flags;
-- DELETE FROM public.comments;
-- DELETE FROM public.reading_progress;
-- DELETE FROM public.newsletter_subscribers WHERE email LIKE 'test%@example.com';
-- -- Note: Don't delete from profiles or auth.users unless you're sure!
