import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  GeoPoint,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import {
  Post,
  User,
  Comment,
  CreatePostRequest,
  UpdateUserRequest,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import { calculateDistance } from '../utils/locationRandomizer';

class FirebaseService {
  private collections = {
    posts: 'posts',
    users: 'users',
    comments: 'comments',
    likes: 'likes',
  };

  private getCurrentUserId(): string {
    const user = auth.currentUser;
    if (!user) throw new Error('用戶未登入');
    return user.uid;
  }

  private docToPost(docSnap: QueryDocumentSnapshot): Post {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      userId: data.userId,
      user: data.user,
      content: data.content,
      media: data.media || [],
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.location.address,
      },
      createdAt: data.createdAt.toDate(),
      likes: data.likes || 0,
      comments: data.comments || 0,
      isLiked: data.isLiked || false,
    };
  }

  async getPosts(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Post>> {
    try {
      const postsRef = collection(db, this.collections.posts);
      const q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => this.docToPost(doc));
      
      return {
        items: posts,
        total: posts.length,
        page,
        pageSize,
        hasMore: posts.length === pageSize,
      };
    } catch (error) {
      console.error('獲取貼文失敗:', error);
      throw error;
    }
  }

  async getPostById(postId: string): Promise<ApiResponse<Post>> {
    try {
      const postRef = doc(db, this.collections.posts, postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        return { success: false, error: '貼文不存在' };
      }

      const post = this.docToPost(postSnap as QueryDocumentSnapshot);
      return { success: true, data: post };
    } catch (error) {
      console.error('獲取貼文失敗:', error);
      return { success: false, error: '獲取貼文失敗' };
    }
  }

  async getNearbyPosts(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<ApiResponse<Post[]>> {
    try {
      // Firestore 不直接支持地理查詢，需要手動篩選
      const postsRef = collection(db, this.collections.posts);
      const q = query(postsRef, orderBy('createdAt', 'desc'), limit(100));
      
      const snapshot = await getDocs(q);
      const nearbyPosts = snapshot.docs
        .map(doc => this.docToPost(doc))
        .filter(post => {
          const distance = calculateDistance(
            { latitude, longitude },
            post.location
          );
          return distance <= radius;
        });

      return { success: true, data: nearbyPosts };
    } catch (error) {
      console.error('獲取附近貼文失敗:', error);
      return { success: false, error: '獲取附近貼文失敗' };
    }
  }

  async createPost(data: CreatePostRequest): Promise<ApiResponse<Post>> {
    try {
      const userId = this.getCurrentUserId();
      const userDoc = await getDoc(doc(db, this.collections.users, userId));
      
      if (!userDoc.exists()) {
        return { success: false, error: '用戶不存在' };
      }

      const user = userDoc.data() as User;
      
      const postData = {
        userId,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
        },
        content: data.content,
        media: data.media,
        location: data.location,
        createdAt: Timestamp.now(),
        likes: 0,
        comments: 0,
      };

      const docRef = await addDoc(collection(db, this.collections.posts), postData);
      const newPost: Post = {
        id: docRef.id,
        ...postData,
        createdAt: new Date(),
        isLiked: false,
      };

      return { success: true, data: newPost };
    } catch (error) {
      console.error('創建貼文失敗:', error);
      return { success: false, error: '創建貼文失敗' };
    }
  }

  async deletePost(postId: string): Promise<ApiResponse<void>> {
    try {
      const userId = this.getCurrentUserId();
      const postRef = doc(db, this.collections.posts, postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        return { success: false, error: '貼文不存在' };
      }

      const postData = postSnap.data();
      if (postData.userId !== userId) {
        return { success: false, error: '無權刪除此貼文' };
      }

      await deleteDoc(postRef);
      return { success: true };
    } catch (error) {
      console.error('刪除貼文失敗:', error);
      return { success: false, error: '刪除貼文失敗' };
    }
  }

  async likePost(postId: string): Promise<ApiResponse<void>> {
    try {
      const userId = this.getCurrentUserId();
      const postRef = doc(db, this.collections.posts, postId);
      
      await updateDoc(postRef, { likes: increment(1) });
      await addDoc(collection(db, this.collections.likes), {
        userId,
        postId,
        createdAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error) {
      console.error('點讚失敗:', error);
      return { success: false, error: '點讚失敗' };
    }
  }

  async unlikePost(postId: string): Promise<ApiResponse<void>> {
    try {
      const userId = this.getCurrentUserId();
      const postRef = doc(db, this.collections.posts, postId);
      
      await updateDoc(postRef, { likes: increment(-1) });

      const likesRef = collection(db, this.collections.likes);
      const q = query(likesRef, where('userId', '==', userId), where('postId', '==', postId));
      const snapshot = await getDocs(q);
      
      snapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      return { success: true };
    } catch (error) {
      console.error('取消讚失敗:', error);
      return { success: false, error: '取消讚失敗' };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const userId = this.getCurrentUserId();
      return await this.getUserById(userId);
    } catch (error) {
      console.error('獲取當前用戶失敗:', error);
      return { success: false, error: '獲取當前用戶失敗' };
    }
  }

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const userRef = doc(db, this.collections.users, userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return { success: false, error: '用戶不存在' };
      }

      const user = { id: userSnap.id, ...userSnap.data() } as User;
      return { success: true, data: user };
    } catch (error) {
      console.error('獲取用戶失敗:', error);
      return { success: false, error: '獲取用戶失敗' };
    }
  }

  async getUserPosts(userId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Post>> {
    try {
      const postsRef = collection(db, this.collections.posts);
      const q = query(
        postsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => this.docToPost(doc));

      return {
        items: posts,
        total: posts.length,
        page,
        pageSize,
        hasMore: posts.length === pageSize,
      };
    } catch (error) {
      console.error('獲取用戶貼文失敗:', error);
      throw error;
    }
  }

  async updateUser(data: UpdateUserRequest): Promise<ApiResponse<User>> {
    try {
      const userId = this.getCurrentUserId();
      const userRef = doc(db, this.collections.users, userId);

      await updateDoc(userRef, data as any);

      const updatedUser = await this.getUserById(userId);
      return updatedUser;
    } catch (error) {
      console.error('更新用戶失敗:', error);
      return { success: false, error: '更新用戶失敗' };
    }
  }

  async getComments(postId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Comment>> {
    try {
      const commentsRef = collection(db, this.collections.comments);
      const q = query(
        commentsRef,
        where('postId', '==', postId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Comment[];

      return {
        items: comments,
        total: comments.length,
        page,
        pageSize,
        hasMore: comments.length === pageSize,
      };
    } catch (error) {
      console.error('獲取評論失敗:', error);
      throw error;
    }
  }

  async createComment(postId: string, content: string): Promise<ApiResponse<Comment>> {
    try {
      const userId = this.getCurrentUserId();
      const userDoc = await getDoc(doc(db, this.collections.users, userId));
      
      if (!userDoc.exists()) {
        return { success: false, error: '用戶不存在' };
      }

      const user = userDoc.data() as User;

      const commentData = {
        postId,
        userId,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
        },
        content,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, this.collections.comments), commentData);
      
      const postRef = doc(db, this.collections.posts, postId);
      await updateDoc(postRef, { comments: increment(1) });

      const newComment: Comment = {
        id: docRef.id,
        ...commentData,
        createdAt: new Date(),
      };

      return { success: true, data: newComment };
    } catch (error) {
      console.error('創建評論失敗:', error);
      return { success: false, error: '創建評論失敗' };
    }
  }

  async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    try {
      const userId = this.getCurrentUserId();
      const commentRef = doc(db, this.collections.comments, commentId);
      const commentSnap = await getDoc(commentRef);

      if (!commentSnap.exists()) {
        return { success: false, error: '評論不存在' };
      }

      const commentData = commentSnap.data();
      if (commentData.userId !== userId) {
        return { success: false, error: '無權刪除此評論' };
      }

      const postRef = doc(db, this.collections.posts, commentData.postId);
      await updateDoc(postRef, { comments: increment(-1) });

      await deleteDoc(commentRef);
      return { success: true };
    } catch (error) {
      console.error('刪除評論失敗:', error);
      return { success: false, error: '刪除評論失敗' };
    }
  }

  async getRecommendedPosts(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Post>> {
    return this.getPosts(page, pageSize);
  }
}

export default new FirebaseService();
