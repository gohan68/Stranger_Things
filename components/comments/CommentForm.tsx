import React, { useState } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { createComment } from '../../lib/api/comments';
import { useAuth } from '../../contexts/AuthContext';

interface CommentFormProps {
  chapterId: string;
  onCommentAdded: () => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({ 
  chapterId, 
  onCommentAdded,
  onSuccess,
  onError 
}) => {
  const { user, isGuest } = useAuth();
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(isGuest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      const errorMsg = 'Please enter a comment';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (content.length > 2000) {
      const errorMsg = 'Comment is too long (max 2000 characters)';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createComment({
        chapter_id: chapterId,
        content: content.trim(),
        is_anonymous: isGuest ? true : isAnonymous,
        user_id: user?.id || null
      });

      setContent('');
      setIsAnonymous(isGuest);
      onCommentAdded();
      onSuccess?.('Comment posted successfully!');
    } catch (err: any) {
      console.error('Error posting comment:', err);
      const errorMsg = err.message || 'Failed to post comment. Please try again.';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-lg p-4" data-testid="comment-form">
      <label htmlFor="comment-input" className="sr-only">Write your comment</label>
      <textarea
        id="comment-input"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts about this chapter..."
        className="w-full bg-transparent text-gray-300 placeholder-gray-600 border-none outline-none resize-none font-sans"
        rows={3}
        maxLength={2000}
        disabled={loading}
        data-testid="comment-textarea"
        aria-label="Comment text"
        aria-describedby={error ? "comment-error" : undefined}
      />
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <div className="flex items-center gap-4">
          {/* Anonymous Toggle (only for authenticated users) */}
          {!isGuest && (
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-st-red"
                disabled={loading}
                aria-label="Post anonymously"
              />
              Post anonymously
            </label>
          )}
          
          {isGuest && (
            <p className="text-sm text-gray-500">
              Posting as <span className="text-gray-400 font-medium">Guest</span>
            </p>
          )}

          <span className="text-xs text-gray-600" aria-live="polite">
            {content.length}/2000 characters
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-st-red hover:bg-st-red-dim disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
          data-testid="comment-submit-button"
          aria-label="Post comment"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              Posting...
            </>
          ) : (
            <>
              <Send size={16} aria-hidden="true" />
              Post Comment
            </>
          )}
        </button>
      </div>

      {error && (
        <div 
          id="comment-error"
          className="mt-3 text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded px-3 py-2 flex items-start gap-2"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );
};
