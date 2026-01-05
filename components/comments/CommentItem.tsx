import React, { useState } from 'react';
import { Trash2, Flag, User, Heart, MessageCircle } from 'lucide-react';
import { CommentWithAuthor } from '../../lib/supabase';
import { deleteComment, flagComment, likeComment, unlikeComment, createReply } from '../../lib/api/comments';
import { useAuth } from '../../contexts/AuthContext';

interface CommentItemProps {
  comment: CommentWithAuthor;
  onDeleted: (commentId: string) => void;
  onReplyAdded?: () => void;
  isReply?: boolean;
  isLastReply?: boolean;
  userLikedIds?: string[];
  accessToken?: string;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onDeleted,
  onReplyAdded,
  isReply = false,
  isLastReply = false,
  userLikedIds = [],
  accessToken = ''
}) => {
  const { user, isAdmin } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [isLiked, setIsLiked] = useState(userLikedIds.includes(comment.id));
  const [liking, setLiking] = useState(false);

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

  const handleLike = async () => {
    if (!user || !accessToken) {
      alert('You must be signed in to like comments');
      return;
    }

    if (liking) return;
    setLiking(true);

    try {
      if (isLiked) {
        const success = await unlikeComment(comment.id, user.id, accessToken);
        if (success) {
          setIsLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
        }
      } else {
        const success = await likeComment(comment.id, user.id, accessToken);
        if (success) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || submittingReply) return;

    if (!user || !accessToken) {
      alert('You must be signed in to reply');
      return;
    }

    setSubmittingReply(true);
    try {
      const success = await createReply(
        comment.id,
        comment.chapter_id,
        replyContent.trim(),
        replyAnonymous,
        user.id,
        accessToken
      );

      if (success) {
        setReplyContent('');
        setShowReplyForm(false);
        setReplyAnonymous(false);
        onReplyAdded?.();
      } else {
        alert('Failed to post reply. Please try again.');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Failed to post reply');
    } finally {
      setSubmittingReply(false);
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
    <div className={`relative ${isReply ? 'pl-8' : ''}`}>
      {/* Connecting line for replies */}
      {isReply && (
        <div className="absolute left-0 top-0 bottom-0 w-8">
          {/* Vertical line */}
          <div
            className={`absolute left-4 top-0 w-0.5 bg-gradient-to-b from-st-red/40 to-st-red/10 ${isLastReply ? 'h-6' : 'h-full'
              }`}
          />
          {/* Horizontal connector */}
          <div className="absolute left-4 top-6 w-3 h-0.5 bg-st-red/30" />
          {/* Node dot */}
          <div className="absolute left-[18px] top-[22px] w-2 h-2 rounded-full bg-st-red/50 border border-st-red/70" />
        </div>
      )}

      <div
        className={`bg-white/5 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors ${isReply ? 'ml-0' : ''
          }`}
        data-testid="comment-item"
      >
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
          <div className="flex items-center gap-1">
            {!isOwnComment && user && (
              <button
                onClick={handleFlag}
                disabled={flagging}
                className="p-2 text-gray-500 hover:text-yellow-400 transition-colors disabled:opacity-50"
                title="Flag comment"
              >
                <Flag size={14} />
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                title="Delete comment"
                data-testid="delete-comment-button"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed mb-3">{comment.content}</p>

        {/* Like & Reply Actions */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={handleLike}
            disabled={liking || !user}
            className={`flex items-center gap-1.5 transition-colors ${isLiked
              ? 'text-red-400'
              : 'text-gray-500 hover:text-red-400'
              } disabled:opacity-50`}
            title={user ? (isLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
          >
            <Heart
              size={16}
              className={isLiked ? 'fill-current' : ''}
            />
            <span>{likeCount > 0 ? likeCount : ''}</span>
          </button>

          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 transition-colors"
            title="Reply"
          >
            <MessageCircle size={16} />
            <span>Reply</span>
          </button>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <form onSubmit={handleReplySubmit} className="mt-4 pt-4 border-t border-white/10">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-st-red/50 resize-none"
              rows={2}
              maxLength={2000}
            />
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={replyAnonymous}
                  onChange={(e) => setReplyAnonymous(e.target.checked)}
                  className="rounded border-gray-600 bg-black/30 text-st-red focus:ring-st-red"
                />
                Post anonymously
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim() || submittingReply}
                  className="px-3 py-1 bg-st-red text-white text-sm rounded hover:bg-st-red/80 transition-colors disabled:opacity-50"
                >
                  {submittingReply ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>
          </form>
        )}

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

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 relative">
          {/* Continuation line from parent to first reply */}
          <div className="absolute left-4 top-0 w-0.5 h-4 bg-st-red/30" />

          {comment.replies.map((reply, index) => (
            <div key={reply.id} className="mt-2">
              <CommentItem
                comment={reply}
                onDeleted={onDeleted}
                onReplyAdded={onReplyAdded}
                isReply={true}
                isLastReply={index === comment.replies!.length - 1}
                userLikedIds={userLikedIds}
                accessToken={accessToken}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
