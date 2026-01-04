import React, { useState, useEffect } from 'react';
import { MessageCircle, Loader2, AlertCircle } from 'lucide-react';
import { CommentWithAuthor } from '../../lib/supabase';
import { fetchComments, subscribeToComments } from '../../lib/api/comments';
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
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  // Check if comments feature is enabled
  const commentsEnabled = import.meta.env.VITE_ENABLE_COMMENTS === 'true';

  useEffect(() => {
    if (!commentsEnabled) return;

    loadComments();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToComments(chapterId, () => {
      // Reload comments when there's a change
      loadComments();
    });

    return () => {
      unsubscribe();
    };
  }, [chapterId, commentsEnabled]);

  const loadComments = async () => {
    try {
      setError(null);
      const data = await fetchComments(chapterId);
      setComments(data);
      // If we got an empty array and there was a database issue, it would have been logged
      // We don't show an error to users - just show "No comments yet"
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = () => {
    loadComments();
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId));
  };

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
              Comments <span className="text-gray-500 text-lg">({comments.length})</span>
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
                  onClick={loadComments}
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
