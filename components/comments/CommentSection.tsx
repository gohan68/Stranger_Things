import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, AlertCircle } from 'lucide-react';
import { CommentWithAuthor } from '../../lib/supabase';
import { fetchComments, subscribeToComments, organizeCommentsIntoThreads, getUserLikes } from '../../lib/api/comments';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import { useAuth } from '../../contexts/AuthContext';
import { CommentsSkeleton } from '../ui/LoadingSkeleton';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../ui/Toast';

interface CommentSectionProps {
  chapterId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ chapterId }) => {
  const { user, session } = useAuth();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLikedIds, setUserLikedIds] = useState<string[]>([]);
  const { toasts, removeToast, success, error: showError } = useToast();

  // Track if we've done the initial load for this chapter
  const initialLoadDoneRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // Check if comments feature is enabled
  const commentsEnabled = import.meta.env.VITE_ENABLE_COMMENTS === 'true';

  // Get access token from session
  const accessToken = session?.access_token || '';

  useEffect(() => {
    isMountedRef.current = true;

    if (!commentsEnabled) {
      setLoading(false);
      return;
    }

    // Reset initial load tracking if user auth state changes
    const isInitialLoad = initialLoadDoneRef.current !== `${chapterId}-${user?.id || 'guest'}`;

    if (isInitialLoad) {
      setLoading(true);
      initialLoadDoneRef.current = `${chapterId}-${user?.id || 'guest'}`;
    }

    // Load comments
    loadComments(isInitialLoad);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToComments(chapterId, () => {
      if (isMountedRef.current) {
        loadComments(false);
      }
    });

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [chapterId, commentsEnabled, user?.id]);

  // Load user likes when user changes
  useEffect(() => {
    if (user && accessToken && chapterId) {
      loadUserLikes();
    } else {
      setUserLikedIds([]);
    }
  }, [user?.id, accessToken, chapterId]);

  const loadUserLikes = async () => {
    if (!user || !accessToken) return;

    try {
      const likedIds = await getUserLikes(chapterId, user.id, accessToken);
      if (isMountedRef.current) {
        setUserLikedIds(likedIds);
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  const loadComments = async (showLoading = true) => {
    try {
      if (showLoading && isMountedRef.current) {
        setLoading(true);
      }
      setError(null);
      const data = await fetchComments(chapterId);

      if (isMountedRef.current) {
        // Organize comments into threaded structure
        const threadedComments = organizeCommentsIntoThreads(data);
        setComments(threadedComments);
      }
    } catch (err: any) {
      console.error('Error loading comments:', err);

      if (isMountedRef.current) {
        if (err.message?.includes('Permission denied') || err.message?.includes('policy')) {
          setError('Comments are currently unavailable due to database permissions. Please check the setup guide.');
        } else {
          setError('Failed to load comments. Please try again later.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCommentAdded = () => {
    loadComments(false);
  };

  const handleReplyAdded = () => {
    loadComments(false);
  };

  const handleCommentDeleted = (commentId: string) => {
    // Remove from top-level or from replies
    setComments(prevComments => {
      return prevComments
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: c.replies?.filter(r => r.id !== commentId)
        }));
    });
  };

  // Count total comments including replies
  const totalCommentCount = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);

  if (!commentsEnabled) {
    return null;
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-12" data-testid="comment-section">
        <div className="border-t border-gray-700 pt-8">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="text-st-red" size={24} />
            <h2 className="text-2xl font-display font-bold text-gray-200">
              Comments <span className="text-gray-500 text-lg">({totalCommentCount})</span>
            </h2>
          </div>

          {/* Comment Form */}
          <CommentForm
            chapterId={chapterId}
            onCommentAdded={handleCommentAdded}
            onSuccess={success}
            onError={showError}
          />

          {/* Comments List */}
          <div className="mt-8 space-y-6" role="list" aria-label="Comments">
            {loading ? (
              <CommentsSkeleton count={3} />
            ) : error ? (
              <div
                className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                  <button
                    onClick={() => loadComments(true)}
                    className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
                    aria-label="Retry loading comments"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-30" aria-hidden="true" />
                <p className="text-lg">No comments yet.</p>
                <p className="text-sm mt-2">Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onDeleted={handleCommentDeleted}
                  onReplyAdded={handleReplyAdded}
                  userLikedIds={userLikedIds}
                  accessToken={accessToken}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};
