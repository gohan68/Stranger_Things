import { supabase, Comment, CommentWithAuthor } from '../supabase';

export interface CreateCommentData {
  chapter_id: string;
  content: string;
  is_anonymous: boolean;
  user_id?: string | null;
}

/**
 * Fetch all comments for a chapter using direct REST API
 * Note: Uses direct fetch instead of Supabase client to avoid auth-related hanging issues
 */
export const fetchComments = async (chapterId: string): Promise<CommentWithAuthor[]> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Comments] Missing Supabase configuration');
    return [];
  }

  // Use direct REST API call to bypass Supabase client issues with authenticated users
  const url = `${supabaseUrl}/rest/v1/comments_with_authors?chapter_id=eq.${encodeURIComponent(chapterId)}&order=created_at.asc`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Comments] API error:', response.status, errorText);
      return [];
    }

    const data = await response.json();
    return data as CommentWithAuthor[];
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[Comments] Request timed out');
    } else {
      console.error('[Comments] Fetch error:', error.message);
    }
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

/**
 * Like a comment
 */
export const likeComment = async (commentId: string, userId: string, accessToken: string): Promise<boolean> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Comments] Missing Supabase configuration');
    return false;
  }

  try {
    const url = `${supabaseUrl}/rest/v1/comment_likes`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        comment_id: commentId,
        user_id: userId
      })
    });

    if (response.status === 201 || response.status === 200) {
      return true;
    }

    // 409 Conflict means already liked (unique constraint)
    if (response.status === 409) {
      return true;
    }

    console.error('[Comments] Like failed:', response.status);
    return false;
  } catch (error) {
    console.error('[Comments] Error liking comment:', error);
    return false;
  }
};

/**
 * Unlike a comment
 */
export const unlikeComment = async (commentId: string, userId: string, accessToken: string): Promise<boolean> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Comments] Missing Supabase configuration');
    return false;
  }

  try {
    const url = `${supabaseUrl}/rest/v1/comment_likes?comment_id=eq.${commentId}&user_id=eq.${userId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return response.ok;
  } catch (error) {
    console.error('[Comments] Error unliking comment:', error);
    return false;
  }
};

/**
 * Get all likes by a user for comments in a chapter (for highlighting liked comments)
 */
export const getUserLikes = async (chapterId: string, userId: string, accessToken: string): Promise<string[]> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !userId) {
    return [];
  }

  try {
    // First get comment IDs for this chapter, then filter likes
    const likesUrl = `${supabaseUrl}/rest/v1/comment_likes?user_id=eq.${userId}&select=comment_id`;
    const response = await fetch(likesUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const likes = await response.json();
      return likes.map((like: { comment_id: string }) => like.comment_id);
    }
    return [];
  } catch (error) {
    console.error('[Comments] Error fetching user likes:', error);
    return [];
  }
};

/**
 * Create a reply to a comment
 */
export const createReply = async (
  parentId: string,
  chapterId: string,
  content: string,
  isAnonymous: boolean,
  userId: string | null,
  accessToken: string
): Promise<boolean> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[Comments] Missing Supabase configuration');
    return false;
  }

  try {
    const url = `${supabaseUrl}/rest/v1/comments`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        parent_id: parentId,
        chapter_id: chapterId,
        content: content,
        is_anonymous: isAnonymous,
        user_id: isAnonymous ? null : userId
      })
    });

    return response.status === 201 || response.status === 200;
  } catch (error) {
    console.error('[Comments] Error creating reply:', error);
    return false;
  }
};

/**
 * Organize flat comments into threaded structure
 */
export const organizeCommentsIntoThreads = (comments: CommentWithAuthor[]): CommentWithAuthor[] => {
  const commentMap = new Map<string, CommentWithAuthor>();
  const topLevelComments: CommentWithAuthor[] = [];

  // First pass: create a map of all comments
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize into parent-child relationships
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!;

    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      // This is a reply - add to parent's replies
      const parent = commentMap.get(comment.parent_id)!;
      if (!parent.replies) parent.replies = [];
      parent.replies.push(commentWithReplies);
    } else {
      // This is a top-level comment
      topLevelComments.push(commentWithReplies);
    }
  });

  // Sort replies by created_at
  topLevelComments.forEach(comment => {
    if (comment.replies) {
      comment.replies.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
  });

  return topLevelComments;
};
