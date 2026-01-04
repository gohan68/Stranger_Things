import { supabase, Comment, CommentWithAuthor } from '../supabase';

export interface CreateCommentData {
  chapter_id: string;
  content: string;
  is_anonymous: boolean;
  user_id?: string | null;
}

/**
 * Fetch all comments for a chapter
 */
export const fetchComments = async (chapterId: string): Promise<CommentWithAuthor[]> => {
  try {
    const { data, error } = await supabase
      .from('comments_with_authors')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error fetching comments:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });

      // Check for permission/policy errors
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('policy')) {
        console.error('⚠️ RLS POLICY ERROR: The comments_with_authors view is restricted.');
        console.error('🔧 FIX: Run /app/supabase/fix-view-permissions.sql in Supabase SQL Editor');
        throw new Error('Permission denied. Please check database policies.');
      }

      // If table doesn't exist or there's a database issue, return empty array
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('Comments table not initialized yet. Please run the schema.sql in Supabase.');
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    // If it's a permission error, throw it to show user a message
    if (error.message?.includes('Permission denied')) {
      throw error;
    }
    // Otherwise return empty array to prevent UI crashes
    return [];
  }
};

/**
 * Create a new comment
 */
export const createComment = async (commentData: CreateCommentData): Promise<Comment> => {
  try {
    // Rate limiting check (simple client-side check)
    // Use a fixed time window (current hour) for rate limiting
    const currentHour = Math.floor(Date.now() / 3600000);
    const rateLimitKey = `comment_rate_limit_${currentHour}`;
    const recentComments = localStorage.getItem(rateLimitKey);
    
    if (recentComments) {
      const count = parseInt(recentComments);
      if (count >= 10) {
        throw new Error('Rate limit exceeded. Please wait before commenting again.');
      }
      localStorage.setItem(rateLimitKey, (count + 1).toString());
    } else {
      localStorage.setItem(rateLimitKey, '1');
      // Clean up old rate limit keys
      setTimeout(() => localStorage.removeItem(rateLimitKey), 3600000); // 1 hour
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating comment:', error);
      throw new Error(error.message || 'Failed to post comment. Please try again.');
    }
    
    if (!data) {
      throw new Error('No data returned from comment creation');
    }
    
    return data;
  } catch (error: any) {
    console.error('Error creating comment:', error);
    // Ensure we throw a user-friendly error message
    throw new Error(error.message || 'Failed to post comment. Please try again.');
  }
};

/**
 * Delete a comment (soft delete)
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', commentId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

/**
 * Flag a comment for moderation
 */
export const flagComment = async (commentId: string, userId: string | null, reason?: string): Promise<void> => {
  try {
    if (!userId) {
      throw new Error('You must be signed in to flag comments');
    }

    const { error } = await supabase
      .from('comment_flags')
      .insert([{
        comment_id: commentId,
        flagged_by_user_id: userId,
        reason: reason || null
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error flagging comment:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time comment updates for a chapter
 */
export const subscribeToComments = (
  chapterId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`comments:${chapterId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `chapter_id=eq.${chapterId}`
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
