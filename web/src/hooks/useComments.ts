import { useState, useCallback } from 'react';
import FirebaseService from '../services/firebase';

interface CommentState {
  [postId: string]: {
    text: string;
    comments: any[];
    loading: boolean;
    visible: boolean;
    replyingTo: string | null;
    replyText: string;
  };
}

export function useComments() {
  const [commentState, setCommentState] = useState<CommentState>({});

  const toggleComments = useCallback(async (postId: string) => {
    setCommentState((prev) => {
      const current = prev[postId] || {
        text: '',
        comments: [],
        loading: false,
        visible: false,
        replyingTo: null,
        replyText: '',
      };

      // 如果要顯示評論且還沒載入過
      if (!current.visible && current.comments.length === 0) {
        loadComments(postId);
      }

      return {
        ...prev,
        [postId]: { ...current, visible: !current.visible },
      };
    });
  }, []);

  const loadComments = useCallback(async (postId: string) => {
    setCommentState((prev) => ({
      ...prev,
      [postId]: { ...(prev[postId] || {}), loading: true } as any,
    }));

    try {
      const comments = await FirebaseService.getComments(postId);
      setCommentState((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] || {}), comments, loading: false } as any,
      }));
    } catch (error) {
      console.error('載入評論失敗:', error);
      setCommentState((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] || {}), loading: false } as any,
      }));
    }
  }, []);

  const updateCommentText = useCallback((postId: string, text: string) => {
    setCommentState((prev) => ({
      ...prev,
      [postId]: { ...(prev[postId] || {}), text } as any,
    }));
  }, []);

  const submitComment = useCallback(async (postId: string) => {
    const state = commentState[postId];
    if (!state || !state.text.trim()) return;

    try {
      const newComment = await FirebaseService.addComment(postId, state.text);
      setCommentState((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          text: '',
          comments: [...(prev[postId]?.comments || []), newComment],
        },
      }));
    } catch (error) {
      console.error('發送評論失敗:', error);
    }
  }, [commentState]);

  const setReplyingTo = useCallback((postId: string, commentId: string | null) => {
    setCommentState((prev) => ({
      ...prev,
      [postId]: { ...(prev[postId] || {}), replyingTo: commentId, replyText: '' } as any,
    }));
  }, []);

  const updateReplyText = useCallback((postId: string, text: string) => {
    setCommentState((prev) => ({
      ...prev,
      [postId]: { ...(prev[postId] || {}), replyText: text } as any,
    }));
  }, []);

  const submitReply = useCallback(
    async (postId: string, commentId: string) => {
      const state = commentState[postId];
      if (!state || !state.replyText.trim()) return;

      try {
        // 使用 addComment 並傳入 parentCommentId
        await FirebaseService.addComment(postId, state.replyText, commentId);
        await loadComments(postId);
        setCommentState((prev) => ({
          ...prev,
          [postId]: { ...prev[postId], replyingTo: null, replyText: '' },
        }));
      } catch (error) {
        console.error('回覆評論失敗:', error);
      }
    },
    [commentState, loadComments]
  );

  return {
    commentState,
    toggleComments,
    updateCommentText,
    submitComment,
    setReplyingTo,
    updateReplyText,
    submitReply,
  };
}
