import { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';
import { Post, CreatePostRequest, PaginatedResponse } from '../types';

export const usePosts = (initialPage: number = 1) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(initialPage);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const loadPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const response: PaginatedResponse<Post> = await ApiService.getPosts(pageNum);
      
      if (append) {
        setPosts(prev => [...prev, ...response.items]);
      } else {
        setPosts(response.items);
      }
      
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError('加載貼文失敗');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    loadPosts(1);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts(1, false);
  }, [loadPosts]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadPosts(page + 1, true);
  }, [hasMore, loading, page, loadPosts]);

  const createPost = async (data: CreatePostRequest): Promise<Post | null> => {
    try {
      const response = await ApiService.createPost(data);
      if (response.success && response.data) {
        setPosts(prev => [response.data!, ...prev]);
        return response.data;
      }
      return null;
    } catch (err) {
      setError('創建貼文失敗');
      console.error(err);
      return null;
    }
  };

  const deletePost = async (postId: string): Promise<boolean> => {
    try {
      const response = await ApiService.deletePost(postId);
      if (response.success) {
        setPosts(prev => prev.filter(post => post.id !== postId));
        return true;
      }
      return false;
    } catch (err) {
      setError('刪除貼文失敗');
      console.error(err);
      return false;
    }
  };

  const toggleLike = async (postId: string): Promise<void> => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        await ApiService.unlikePost(postId);
      } else {
        await ApiService.likePost(postId);
      }

      // 更新本地狀態
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked,
            likes: p.isLiked ? p.likes - 1 : p.likes + 1,
          };
        }
        return p;
      }));
    } catch (err) {
      setError('操作失敗');
      console.error(err);
    }
  };

  return {
    posts,
    loading,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    createPost,
    deletePost,
    toggleLike,
  };
};

/**
 * 使用單個貼文的 Hook
 */
export const usePost = (postId: string) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      try {
        const response = await ApiService.getPostById(postId);
        if (response.success && response.data) {
          setPost(response.data);
        }
      } catch (err) {
        setError('加載貼文失敗');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  return { post, loading, error };
};

/**
 * 使用附近貼文的 Hook
 */
export const useNearbyPosts = (latitude?: number, longitude?: number, radius: number = 10) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadNearbyPosts = useCallback(async () => {
    if (!latitude || !longitude) return;

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.getNearbyPosts(latitude, longitude, radius);
      if (response.success && response.data) {
        setPosts(response.data);
      }
    } catch (err) {
      setError('加載附近貼文失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radius]);

  useEffect(() => {
    loadNearbyPosts();
  }, [loadNearbyPosts]);

  return { posts, loading, error, refresh: loadNearbyPosts };
};
