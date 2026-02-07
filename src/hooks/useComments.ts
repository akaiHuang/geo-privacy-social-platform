import { useState, useEffect, useCallback } from 'react';
import FirebaseService from '../services/firebase';
import { Comment } from '../types';

/**
 * 管理貼文留言的 Hook
 */
export const useComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setError(null);
      const response = await FirebaseService.getComments(postId);
      setComments(response.items);
    } catch (err) {
      console.error('獲取留言失敗:', err);
      setError('獲取留言失敗');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    try {
      const response = await FirebaseService.createComment(postId, content);
      if (response.success && response.data) {
        setComments((prev) => [response.data!, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('新增留言失敗:', err);
      return false;
    }
  };

  const refresh = () => {
    setRefreshing(true);
    fetchComments();
  };

  return {
    comments,
    loading,
    error,
    refreshing,
    addComment,
    refresh,
  };
};
