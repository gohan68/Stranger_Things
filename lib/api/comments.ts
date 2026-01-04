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

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

/**
 * Create a new comment
 */
export const createComment = async (commentData: CreateCommentData): Promise<Comment> => {
  try {
    // Rate limiting check (simple client-side check)
    const rateLimitKey = `comment_rate_limit_${Date.now()}`;
    const recentComments = localStorage.getItem(rateLimitKey);
    
    if (recentComments) {
      const count = parseInt(recentComments);
      if (count >= 10) {
        throw new Error('Rate limit exceeded. Please wait before commenting again.');
      }
      localStorage.setItem(rateLimitKey, (count + 1).toString());
    } else {
      localStorage.setItem(rateLimitKey, '1');
      setTimeout(() => localStorage.removeItem(rateLimitKey), 3600000); // 1 hour
    }

    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
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
