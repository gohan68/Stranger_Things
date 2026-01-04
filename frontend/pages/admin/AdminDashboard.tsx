import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Flag, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, CommentWithAuthor } from '../../lib/supabase';
import { deleteComment } from '../../lib/api/comments';

export const AdminDashboard: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [flaggedComments, setFlaggedComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
      return;
    }

    if (isAdmin) {
      loadFlaggedComments();
    }
  }, [isAdmin, authLoading, navigate]);

  const loadFlaggedComments = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('comments_with_authors')
        .select('*')
        .eq('is_flagged', true)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlaggedComments(data || []);
    } catch (err: any) {
      console.error('Error loading flagged comments:', err);
      setError(err.message || 'Failed to load flagged comments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteComment(commentId);
      setFlaggedComments(flaggedComments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    }
  };

  const handleUnflagComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_flagged: false })
        .eq('id', commentId);

      if (error) throw error;

      // Also remove flags
      await supabase
        .from('comment_flags')
        .delete()
        .eq('comment_id', commentId);

      setFlaggedComments(flaggedComments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error unflagging comment:', error);
      alert('Failed to unflag comment');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-st-red" size={48} />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-st-black py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-st-red" size={32} />
            <h1 className="text-3xl font-display font-bold text-gray-200">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500">Manage flagged comments and moderate content</p>
        </div>

        {/* Flagged Comments */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Flag className="text-yellow-400" size={24} />
              <h2 className="text-xl font-display font-bold text-gray-200">
                Flagged Comments <span className="text-gray-500 text-base">({flaggedComments.length})</span>
              </h2>
            </div>
            <button
              onClick={loadFlaggedComments}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors text-sm"
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {flaggedComments.length === 0 ? (
            <div className="text-center py-12">
              <Flag size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500">No flagged comments</p>
              <p className="text-gray-600 text-sm mt-2">All comments are in good standing!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {flaggedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-st-charcoal border border-yellow-500/30 rounded-lg p-4"
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-300">{comment.author_name}</span>
                        <span className="px-2 py-0.5 bg-yellow-900/30 text-yellow-400 text-xs rounded border border-yellow-500/30">
                          {comment.flag_count} flag{comment.flag_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Chapter: {comment.chapter_id} • {new Date(comment.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUnflagComment(comment.id)}
                        className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded transition-colors text-sm"
                        title="Mark as safe"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded transition-colors text-sm flex items-center gap-1"
                        title="Delete comment"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="bg-black/20 border border-white/5 rounded p-3">
                    <p className="text-gray-300 whitespace-pre-wrap text-sm">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
