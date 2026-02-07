import { useState, useEffect, useCallback } from 'react';
import FirebaseService from '../services/firebase';
import { Post } from '../types';

export function usePosts(userId: string | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const fetchedPosts = await FirebaseService.getPosts(50);
      
      // 檢查每個貼文的狀態
      const postsWithStatus = await Promise.all(
        fetchedPosts.map(async (post) => {
          const [isLiked, isFavorited] = await Promise.all([
            FirebaseService.checkIfLiked(post.id),
            FirebaseService.isFavorited(post.id),
          ]);
          return { ...post, isLiked, isFavorited };
        })
      );
      
      setPosts(postsWithStatus);
    } catch (error) {
      console.error('載入貼文失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Realtime 監聽貼文更新
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = FirebaseService.subscribeToPostsRealtime(50, (fetchedPosts) => {
      setPosts((prevPosts) => {
        if (prevPosts.length === 0) return prevPosts;
        
        // 合併更新，保留本地狀態
        return fetchedPosts.map((newPost) => {
          const existingPost = prevPosts.find((p) => p.id === newPost.id);
          if (existingPost) {
            return {
              ...newPost,
              isLiked: existingPost.isLiked,
              isFavorited: existingPost.isFavorited,
            };
          }
          return newPost;
        });
      });
    });

    return unsubscribe;
  }, [userId]);

  const toggleLike = useCallback(async (postId: string) => {
    // 樂觀更新
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const newIsLiked = !post.isLiked;
          return {
            ...post,
            isLiked: newIsLiked,
            likes: newIsLiked ? post.likes + 1 : post.likes - 1,
          };
        }
        return post;
      })
    );

    try {
      await FirebaseService.toggleLike(postId);
    } catch (error) {
      console.error('按讚失敗:', error);
      // 回滾
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const revertIsLiked = !post.isLiked;
            return {
              ...post,
              isLiked: revertIsLiked,
              likes: revertIsLiked ? post.likes + 1 : post.likes - 1,
            };
          }
          return post;
        })
      );
    }
  }, []);

  const toggleFavorite = useCallback(async (postId: string) => {
    // 樂觀更新
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isFavorited: !post.isFavorited } : post
      )
    );

    try {
      await FirebaseService.toggleFavorite(postId);
    } catch (error) {
      console.error('收藏失敗:', error);
      // 回滾
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, isFavorited: !post.isFavorited } : post
        )
      );
    }
  }, []);

  return {
    posts,
    loading,
    loadPosts,
    toggleLike,
    toggleFavorite,
    setPosts,
  };
}
