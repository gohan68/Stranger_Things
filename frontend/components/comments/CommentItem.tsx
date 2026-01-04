import React, { useState } from 'react';
import { Trash2, Flag, User, Shield } from 'lucide-react';
import { CommentWithAuthor } from '../../lib/supabase';
import { deleteComment, flagComment } from '../../lib/api/comments';
import { useAuth } from '../../contexts/AuthContext';

interface CommentItemProps {
  comment: CommentWithAuthor;
  onDeleted: (commentId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onDeleted }) => {
  const { user, isAdmin } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [flagging, setFlagging] = useState(false);

  const isOwnComment = user && comment.user_id === user.id;
  const canDelete = isOwnComment || isAdmin;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteComment(comment.id);
      onDeleted(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleFlag = async () => {
    if (!user) {
      alert('You must be signed in to flag comments');
      return;
    }

    setFlagging(true);
    try {
      await flagComment(comment.id, user.id);
      alert('Comment has been flagged for review. Thank you!');
    } catch (error: any) {
      console.error('Error flagging comment:', error);
      alert(error.message || 'Failed to flag comment');
    } finally {
      setFlagging(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors" data-testid="comment-item">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {comment.author_avatar ? (
            <img
              src={comment.author_avatar}
              alt={comment.author_name}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-st-red/20 flex items-center justify-center">
              <User size={20} className="text-st-red" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-300">{comment.author_name}</span>
              {comment.is_flagged && isAdmin && (
                <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded border border-red-500/30">
                  Flagged
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isOwnComment && user && (
            <button
              onClick={handleFlag}
              disabled={flagging}
              className="p-2 text-gray-500 hover:text-yellow-400 transition-colors disabled:opacity-50"
              title="Flag comment"
            >
              <Flag size={16} />
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors"
              title="Delete comment"
              data-testid="delete-comment-button"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{comment.content}</p>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400 mb-3">Are you sure you want to delete this comment?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
