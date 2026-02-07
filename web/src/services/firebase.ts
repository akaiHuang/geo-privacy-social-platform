import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  increment,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, storage, auth } from '../config/firebase';
import { 
  Post, 
  Comment, 
  Media, 
  Location, 
  UserInfo, 
  FriendRequest, 
  FriendRequestStatus, 
  Notification,
  NotificationType,
} from '../types';

function addLocationRandomOffset(location: Location): Location {
  const offsetLat = (Math.random() - 0.5) * 0.036;
  const offsetLng = (Math.random() - 0.5) * 0.036;
  
  return {
    latitude: location.latitude + offsetLat,
    longitude: location.longitude + offsetLng,
    address: location.address,
  };
}

class FirebaseService {
  async uploadImage(file: File): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('用戶未登入');

    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `posts/${userId}/${filename}`);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  async createPost(
    content: string,
    mediaFiles: File[],
    location: Location
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false, error: '用戶未登入' };

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return { success: false, error: '用戶不存在' };

      const user = userDoc.data() as UserInfo;

      const media: Media[] = [];
      for (const file of mediaFiles) {
        const url = await this.uploadImage(file);
        media.push({
          id: Date.now().toString(),
          type: file.type.startsWith('video') ? 1 as any : 0 as any,
          uri: url,
        });
      }

      const randomizedLocation = addLocationRandomOffset(location);

      const userData: any = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      };
      
      if (user.avatar) {
        userData.avatar = user.avatar;
      }

      const postData: any = {
        userId,
        user: userData,
        content,
        media,
        location: randomizedLocation,
        originalLocation: location,
        createdAt: Timestamp.now(),
        likes: 0,
        comments: 0,
      };

      const removeUndefined = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined);
        } else if (obj !== null && typeof obj === 'object') {
          if (obj instanceof Timestamp || obj.constructor?.name === 'Timestamp') {
            return obj;
          }
          const cleaned: any = {};
          for (const key in obj) {
            if (obj[key] !== undefined) {
              cleaned[key] = removeUndefined(obj[key]);
            }
          }
          return cleaned;
        }
        return obj;
      };

      const cleanPostData = removeUndefined(postData);

      await addDoc(collection(db, 'posts'), cleanPostData);
      return { success: true };
    } catch (error: any) {
      console.error('創建貼文失敗:', error);
      return { success: false, error: error.message };
    }
  }

  async getPosts(limitCount: number = 20): Promise<Post[]> {
    try {
      const q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                     data.createdAt instanceof Date ? data.createdAt : 
                     new Date(),
        };
      }) as Post[];
    } catch (error) {
      console.error('獲取貼文失敗:', error);
      return [];
    }
  }

  subscribeToPostsRealtime(limitCount: number = 20, callback: (posts: Post[]) => void): () => void {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                     data.createdAt instanceof Date ? data.createdAt : 
                     new Date(),
        };
      }) as Post[];
      
      console.log('🔄 Realtime 更新：收到', posts.length, '則貼文');
      callback(posts);
    }, (error) => {
      console.error('❌ Realtime 監聽錯誤:', error);
    });

    return unsubscribe;
  }

  async checkIfLiked(postId: string): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return false;

      const likesRef = collection(db, 'likes');
      const q = query(likesRef, where('userId', '==', userId), where('postId', '==', postId));
      const snapshot = await getDocs(q);
      
      return !snapshot.empty;
    } catch (error) {
      console.error('檢查按讚失敗:', error);
      return false;
    }
  }

  async likePost(postId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false, message: '請先登入' };

      const alreadyLiked = await this.checkIfLiked(postId);
      if (alreadyLiked) {
        return { success: false, message: '您已經按過讚了' };
      }

      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (!postDoc.exists()) {
        return { success: false, message: '貼文不存在' };
      }
      const post = postDoc.data();

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { likes: increment(1) });

      await addDoc(collection(db, 'likes'), {
        userId,
        postId,
        createdAt: Timestamp.now(),
      });

      if (post.userId !== userId) {
        await this.createNotification(post.userId, NotificationType.POST_LIKED, userId, postId);
      }

      return { success: true };
    } catch (error) {
      console.error('按讚失敗:', error);
      return { success: false, message: '按讚失敗' };
    }
  }

  async unlikePost(postId: string): Promise<{ success: boolean }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false };

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { likes: increment(-1) });

      const likesRef = collection(db, 'likes');
      const q = query(likesRef, where('userId', '==', userId), where('postId', '==', postId));
      const snapshot = await getDocs(q);
      
      snapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      return { success: true };
    } catch (error) {
      console.error('取消讚失敗:', error);
      return { success: false };
    }
  }

  async toggleLike(postId: string): Promise<{ success: boolean; isLiked: boolean }> {
    try {
      const alreadyLiked = await this.checkIfLiked(postId);
      
      if (alreadyLiked) {
        await this.unlikePost(postId);
        return { success: true, isLiked: false };
      } else {
        const result = await this.likePost(postId);
        return { success: result.success, isLiked: true };
      }
    } catch (error) {
      console.error('切換按讚失敗:', error);
      return { success: false, isLiked: false };
    }
  }

  async getComments(postId: string): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                     data.createdAt instanceof Date ? data.createdAt : 
                     new Date(),
        };
      }) as Comment[];
    } catch (error) {
      console.error('獲取評論失敗:', error);
      return [];
    }
  }

  async createComment(postId: string, content: string, parentCommentId?: string): Promise<{ success: boolean }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false };

      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return { success: false };

      const user = userDoc.data() as UserInfo;

      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (!postDoc.exists()) return { success: false };
      const post = postDoc.data();

      const userData: any = {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      };
      if (user.avatar) {
        userData.avatar = user.avatar;
      }

      const commentData: any = {
        postId,
        userId,
        user: userData,
        content,
        createdAt: Timestamp.now(),
      };

      if (parentCommentId) {
        commentData.parentCommentId = parentCommentId;
      }

      const commentRef = await addDoc(collection(db, 'comments'), commentData);

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { comments: increment(1) });

      if (post.userId !== userId) {
        await this.createNotification(post.userId, NotificationType.POST_COMMENTED, userId, postId, commentRef.id);
      }

      return { success: true };
    } catch (error) {
      console.error('創建評論失敗:', error);
      return { success: false };
    }
  }

  async addComment(postId: string, content: string, parentCommentId?: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.createComment(postId, content, parentCommentId);
    return result.success ? { success: true } : { success: false, error: '評論失敗' };
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    try {
      const q = query(
        collection(db, 'posts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // 安全處理 createdAt，可能是 Timestamp 或已經是 Date
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        };
      }) as Post[];
    } catch (error) {
      console.error('獲取用戶貼文失敗:', error);
      return [];
    }
  }

  async getFriendshipStatus(targetUserId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked'> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || userId === targetUserId) return 'none';

      const blockQuery1 = query(collection(db, 'blocks'), where('blockerId', '==', userId), where('blockedId', '==', targetUserId));
      const blockQuery2 = query(collection(db, 'blocks'), where('blockerId', '==', targetUserId), where('blockedId', '==', userId));
      const [blockSnapshot1, blockSnapshot2] = await Promise.all([getDocs(blockQuery1), getDocs(blockQuery2)]);
      
      if (!blockSnapshot1.empty || !blockSnapshot2.empty) return 'blocked';

      // 檢查是否已是好友
      const friendQuery1 = query(collection(db, 'friendships'), where('userId1', '==', userId), where('userId2', '==', targetUserId));
      const friendQuery2 = query(collection(db, 'friendships'), where('userId1', '==', targetUserId), where('userId2', '==', userId));
      const [friendSnapshot1, friendSnapshot2] = await Promise.all([getDocs(friendQuery1), getDocs(friendQuery2)]);
      
      if (!friendSnapshot1.empty || !friendSnapshot2.empty) return 'friends';

      // 檢查待處理的好友請求
      const requestQuery1 = query(collection(db, 'friend_requests'), where('fromUserId', '==', userId), where('toUserId', '==', targetUserId), where('status', '==', FriendRequestStatus.PENDING));
      const requestQuery2 = query(collection(db, 'friend_requests'), where('fromUserId', '==', targetUserId), where('toUserId', '==', userId), where('status', '==', FriendRequestStatus.PENDING));
      const [requestSnapshot1, requestSnapshot2] = await Promise.all([getDocs(requestQuery1), getDocs(requestQuery2)]);
      
      if (!requestSnapshot1.empty) return 'pending_sent';
      if (!requestSnapshot2.empty) return 'pending_received';

      return 'none';
    } catch (error) {
      console.error('檢查好友關係失敗:', error);
      return 'none';
    }
  }

  async sendFriendRequest(toUserId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false, message: '請先登入' };
      if (userId === toUserId) return { success: false, message: '不能加自己為好友' };

      // 檢查當前關係
      const status = await this.getFriendshipStatus(toUserId);
      if (status === 'blocked') return { success: false, message: '無法發送好友請求' };
      if (status === 'friends') return { success: false, message: '你們已經是好友了' };
      if (status === 'pending_sent') return { success: false, message: '已發送好友請求' };
      if (status === 'pending_received') return { success: false, message: '對方已向你發送好友請求' };

      // 獲取用戶資料
      const [fromUserDoc, toUserDoc] = await Promise.all([
        getDoc(doc(db, 'users', userId)),
        getDoc(doc(db, 'users', toUserId))
      ]);

      if (!fromUserDoc.exists() || !toUserDoc.exists()) {
        return { success: false, message: '用戶不存在' };
      }

      const fromUser = { id: userId, ...fromUserDoc.data() } as UserInfo;
      const toUser = { id: toUserId, ...toUserDoc.data() } as UserInfo;

      // 創建好友請求
      await addDoc(collection(db, 'friend_requests'), {
        fromUserId: userId,
        fromUser: {
          id: fromUser.id,
          username: fromUser.username,
          displayName: fromUser.displayName,
          ...(fromUser.avatar && { avatar: fromUser.avatar }),
        },
        toUserId,
        toUser: {
          id: toUser.id,
          username: toUser.username,
          displayName: toUser.displayName,
          ...(toUser.avatar && { avatar: toUser.avatar }),
        },
        status: FriendRequestStatus.PENDING,
        createdAt: Timestamp.now(),
      });

      // 發送通知
      await this.createNotification(toUserId, NotificationType.FRIEND_REQUEST, userId);

      return { success: true };
    } catch (error) {
      console.error('發送好友請求失敗:', error);
      return { success: false, message: '發送好友請求失敗' };
    }
  }

  async acceptFriendRequest(requestId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false, message: '請先登入' };

      const requestDoc = await getDoc(doc(db, 'friend_requests', requestId));
      if (!requestDoc.exists()) return { success: false, message: '請求不存在' };

      const request = requestDoc.data();
      if (request.toUserId !== userId) return { success: false, message: '無權限操作' };
      if (request.status !== FriendRequestStatus.PENDING) return { success: false, message: '請求已處理' };

      // 更新請求狀態
      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: FriendRequestStatus.ACCEPTED,
      });

      // 創建好友關係
      await addDoc(collection(db, 'friendships'), {
        userId1: request.fromUserId,
        userId2: userId,
        createdAt: Timestamp.now(),
      });

      // 發送通知給請求方
      await this.createNotification(request.fromUserId, NotificationType.FRIEND_ACCEPTED, userId);

      return { success: true };
    } catch (error) {
      console.error('接受好友請求失敗:', error);
      return { success: false, message: '接受好友請求失敗' };
    }
  }

  async rejectFriendRequest(requestId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false, message: '請先登入' };

      const requestDoc = await getDoc(doc(db, 'friend_requests', requestId));
      if (!requestDoc.exists()) return { success: false, message: '請求不存在' };

      const request = requestDoc.data();
      if (request.toUserId !== userId) return { success: false, message: '無權限操作' };

      await updateDoc(doc(db, 'friend_requests', requestId), {
        status: FriendRequestStatus.REJECTED,
      });

      return { success: true };
    } catch (error) {
      console.error('拒絕好友請求失敗:', error);
      return { success: false, message: '拒絕好友請求失敗' };
    }
  }

  async removeFriend(friendUserId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false, message: '請先登入' };

      const q1 = query(collection(db, 'friendships'), where('userId1', '==', userId), where('userId2', '==', friendUserId));
      const q2 = query(collection(db, 'friendships'), where('userId1', '==', friendUserId), where('userId2', '==', userId));
      
      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      
      const deletePromises: Promise<void>[] = [];
      snapshot1.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
      snapshot2.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
      
      await Promise.all(deletePromises);

      return { success: true };
    } catch (error) {
      console.error('刪除好友失敗:', error);
      return { success: false, message: '刪除好友失敗' };
    }
  }

  async blockUser(blockedUserId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false, message: '請先登入' };
      if (userId === blockedUserId) return { success: false, message: '不能封鎖自己' };

      // 檢查是否已封鎖
      const blockQuery = query(collection(db, 'blocks'), where('blockerId', '==', userId), where('blockedId', '==', blockedUserId));
      const blockSnapshot = await getDocs(blockQuery);
      
      if (!blockSnapshot.empty) return { success: false, message: '已封鎖此用戶' };

      // 刪除好友關係
      await this.removeFriend(blockedUserId);

      // 創建封鎖記錄
      await addDoc(collection(db, 'blocks'), {
        blockerId: userId,
        blockedId: blockedUserId,
        createdAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error) {
      console.error('封鎖用戶失敗:', error);
      return { success: false, message: '封鎖用戶失敗' };
    }
  }

  async unblockUser(blockedUserId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false, message: '請先登入' };

      const blockQuery = query(collection(db, 'blocks'), where('blockerId', '==', userId), where('blockedId', '==', blockedUserId));
      const blockSnapshot = await getDocs(blockQuery);
      
      const deletePromises: Promise<void>[] = [];
      blockSnapshot.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
      await Promise.all(deletePromises);

      return { success: true };
    } catch (error) {
      console.error('解除封鎖失敗:', error);
      return { success: false, message: '解除封鎖失敗' };
    }
  }

  async getPendingFriendRequests(): Promise<FriendRequest[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const q = query(
        collection(db, 'friend_requests'),
        where('toUserId', '==', userId),
        where('status', '==', FriendRequestStatus.PENDING),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as FriendRequest[];
    } catch (error) {
      console.error('獲取好友請求失敗:', error);
      return [];
    }
  }


  async createNotification(
    toUserId: string,
    type: NotificationType,
    fromUserId: string,
    postId?: string,
    commentId?: string
  ): Promise<void> {
    try {
      const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
      if (!fromUserDoc.exists()) return;

      const fromUser = { id: fromUserId, ...fromUserDoc.data() } as UserInfo;

      await addDoc(collection(db, 'notifications'), {
        userId: toUserId,
        type,
        fromUserId,
        fromUser: {
          id: fromUser.id,
          username: fromUser.username,
          displayName: fromUser.displayName,
          ...(fromUser.avatar && { avatar: fromUser.avatar }),
        },
        ...(postId && { postId }),
        ...(commentId && { commentId }),
        read: false,
        createdAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('創建通知失敗:', error);
    }
  }

  async getNotifications(limitCount: number = 50): Promise<Notification[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Notification[];
    } catch (error) {
      console.error('獲取通知失敗:', error);
      return [];
    }
  }

  subscribeToNotificationsRealtime(limitCount: number = 50, callback: (notifications: Notification[]) => void): () => void {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn('⚠️ 用戶未登入，無法監聽通知');
      return () => {};
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Notification[];
      
      console.log('🔔 Realtime 更新：收到', notifications.length, '則通知');
      callback(notifications);
    }, (error) => {
      console.error('❌ 通知 Realtime 監聽錯誤:', error);
    });

    return unsubscribe;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (error) {
      console.error('標記通知為已讀失敗:', error);
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('標記所有通知為已讀失敗:', error);
    }
  }

  subscribeToNotifications(callback: (notifications: Notification[]) => void): () => void {
    const userId = auth.currentUser?.uid;
    if (!userId) return () => {};

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Notification[];
      
      callback(notifications);
    });
  }

  
  async toggleFavorite(postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('用戶未登入');

      // 檢查是否已收藏
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // 添加收藏
        await addDoc(collection(db, 'favorites'), {
          userId,
          postId,
          createdAt: Timestamp.now(),
        });
      } else {
        // 移除收藏
        await deleteDoc(snapshot.docs[0].ref);
      }

      return { success: true };
    } catch (error: any) {
      console.error('收藏操作失敗:', error);
      return { success: false, error: error.message };
    }
  }

  async getFavorites(userId: string): Promise<any[]> {
    try {
      // 安全性檢查：只能查詢自己的收藏
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId || currentUserId !== userId) {
        console.warn('安全性警告：嘗試查詢他人的收藏資料');
        return [];
      }
      
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const favorites = await Promise.all(
        snapshot.docs.map(async (favDoc) => {
          const favData = favDoc.data();
          const postDoc = await getDoc(doc(db, 'posts', favData.postId));
          
          if (postDoc.exists()) {
            const postData = postDoc.data();
            const userDoc = await getDoc(doc(db, 'users', postData.userId));
            const userData = userDoc.data();

            // 檢查是否已按讚
            const isLiked = await this.checkIfLiked(postDoc.id);

            return {
              id: favDoc.id,
              userId: favData.userId,
              postId: favData.postId,
              createdAt: favData.createdAt.toDate(),
              post: {
                id: postDoc.id,
                ...postData,
                user: userData,
                createdAt: postData.createdAt.toDate ? postData.createdAt.toDate() : postData.createdAt,
                isFavorited: true, // 從收藏列表來的貼文都是已收藏
                isLiked, // 檢查按讚狀態
              },
            };
          }
          return null;
        })
      );

      return favorites.filter(f => f !== null);
    } catch (error) {
      console.error('獲取收藏失敗:', error);
      return [];
    }
  }

  async isFavorited(postId: string): Promise<boolean> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return false;

      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('檢查收藏狀態失敗:', error);
      return false;
    }
  }

  
  async addViewHistory(postId: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // 檢查是否已有此貼文的歷史記錄
      const q = query(
        collection(db, 'view_history'),
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // 新增記錄
        await addDoc(collection(db, 'view_history'), {
          userId,
          postId,
          viewedAt: Timestamp.now(),
        });
      } else {
        // 更新瀏覽時間
        await updateDoc(snapshot.docs[0].ref, {
          viewedAt: Timestamp.now(),
        });
      }

      // 限制歷史記錄數量為300條（等待索引建立完成後啟用）
      // await this.enforceViewHistoryLimit(userId);
    } catch (error) {
      console.error('添加瀏覽歷史失敗:', error);
    }
  }

  async getViewHistory(userId: string): Promise<any[]> {
    try {
      // 安全性檢查：只能查詢自己的歷史記錄
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId || currentUserId !== userId) {
        console.warn('安全性警告：嘗試查詢他人的歷史記錄');
        return [];
      }
      
      const q = query(
        collection(db, 'view_history'),
        where('userId', '==', userId),
        orderBy('viewedAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);

      const history = await Promise.all(
        snapshot.docs.map(async (historyDoc) => {
          const historyData = historyDoc.data();
          const postDoc = await getDoc(doc(db, 'posts', historyData.postId));
          
          if (postDoc.exists()) {
            const postData = postDoc.data();
            const userDoc = await getDoc(doc(db, 'users', postData.userId));
            const userData = userDoc.data();

            // 檢查收藏和按讚狀態
            const isFavorited = await this.isFavorited(postDoc.id);
            const isLiked = await this.checkIfLiked(postDoc.id);

            return {
              id: historyDoc.id,
              userId: historyData.userId,
              postId: historyData.postId,
              viewedAt: historyData.viewedAt.toDate ? historyData.viewedAt.toDate() : historyData.viewedAt,
              post: {
                id: postDoc.id,
                ...postData,
                user: userData,
                createdAt: postData.createdAt.toDate ? postData.createdAt.toDate() : postData.createdAt,
                isFavorited, // 檢查收藏狀態
                isLiked, // 檢查按讚狀態
              },
            };
          }
          return null;
        })
      );

      return history.filter(h => h !== null);
    } catch (error) {
      console.error('獲取瀏覽歷史失敗:', error);
      return [];
    }
  }

  async deleteViewHistory(historyId: string) {
    try {
      await deleteDoc(doc(db, 'view_history', historyId));
    } catch (error) {
      console.error('刪除瀏覽歷史失敗:', error);
      throw error;
    }
  }

  async clearAllViewHistory(userId: string) {
    try {
      const q = query(
        collection(db, 'view_history'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('清除所有瀏覽歷史失敗:', error);
      throw error;
    }
  }

  // @ts-ignore - Will be used after Firestore index is ready
  private async enforceViewHistoryLimit(userId: string) {
    try {
      const q = query(
        collection(db, 'view_history'),
        where('userId', '==', userId),
        orderBy('viewedAt', 'desc')
      );
      const snapshot = await getDocs(q);

      if (snapshot.docs.length > 300) {
        const docsToDelete = snapshot.docs.slice(300);
        const deletePromises = docsToDelete.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error('限制瀏覽歷史數量失敗:', error);
    }
  }

  // 上傳用戶頭像
  async uploadAvatar(file: File): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('用戶未登入');

    const filename = `avatar_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `avatars/${userId}/${filename}`);
    
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  // 更新用戶個人資料
  async updateUserProfile(updates: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    birthday?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    badge?: string;
    website?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return { success: false, error: '用戶未登入' };

      const userRef = doc(db, 'users', userId);
      
      // 準備更新資料
      const updateData: any = {};
      if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
      if (updates.bio !== undefined) updateData.bio = updates.bio;
      if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
      if (updates.birthday !== undefined) updateData.birthday = updates.birthday;
      if (updates.gender !== undefined) updateData.gender = updates.gender;
      if (updates.badge !== undefined) updateData.badge = updates.badge;
      if (updates.website !== undefined) updateData.website = updates.website;

      // 更新 Firestore users 集合
      await updateDoc(userRef, updateData);

      // 如果有更新 displayName 或 avatar，也更新 Firebase Auth
      if (updates.displayName || updates.avatar) {
        const authUpdates: any = {};
        if (updates.displayName) authUpdates.displayName = updates.displayName;
        if (updates.avatar) authUpdates.photoURL = updates.avatar;
        
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, authUpdates);
        }
      }

      // 🔄 批次更新所有相關資料（Instagram 策略）
      // 只在 displayName、avatar 或 badge 變更時才需要更新
      if (updates.displayName || updates.avatar || updates.badge) {
        await this.updateUserInfoInPosts(userId, {
          displayName: updates.displayName,
          avatar: updates.avatar,
          badge: updates.badge,
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('更新用戶資料失敗:', error);
      return { success: false, error: error.message };
    }
  }

  // 批次更新貼文和留言中的用戶資訊
  private async updateUserInfoInPosts(
    userId: string,
    updates: { displayName?: string; avatar?: string; badge?: string }
  ): Promise<void> {
    try {
      // 1. 更新用戶的所有貼文
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      const updatePromises: Promise<void>[] = [];
      
      postsSnapshot.docs.forEach((postDoc) => {
        const updateData: any = {};
        if (updates.displayName) updateData['user.displayName'] = updates.displayName;
        if (updates.avatar) updateData['user.avatar'] = updates.avatar;
        if (updates.badge !== undefined) updateData['user.badge'] = updates.badge;
        
        updatePromises.push(updateDoc(postDoc.ref, updateData));
      });

      // 2. 更新用戶的所有留言
      const commentsQuery = query(
        collection(db, 'comments'),
        where('userId', '==', userId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      
      commentsSnapshot.docs.forEach((commentDoc) => {
        const updateData: any = {};
        if (updates.displayName) updateData['user.displayName'] = updates.displayName;
        if (updates.avatar) updateData['user.avatar'] = updates.avatar;
        if (updates.badge !== undefined) updateData['user.badge'] = updates.badge;
        
        updatePromises.push(updateDoc(commentDoc.ref, updateData));
      });

      // 3. 更新好友請求中的資訊
      const friendRequestsFromQuery = query(
        collection(db, 'friendRequests'),
        where('fromUserId', '==', userId)
      );
      const friendRequestsFromSnapshot = await getDocs(friendRequestsFromQuery);
      
      friendRequestsFromSnapshot.docs.forEach((frDoc) => {
        const updateData: any = {};
        if (updates.displayName) updateData['fromUser.displayName'] = updates.displayName;
        if (updates.avatar) updateData['fromUser.avatar'] = updates.avatar;
        
        updatePromises.push(updateDoc(frDoc.ref, updateData));
      });

      const friendRequestsToQuery = query(
        collection(db, 'friendRequests'),
        where('toUserId', '==', userId)
      );
      const friendRequestsToSnapshot = await getDocs(friendRequestsToQuery);
      
      friendRequestsToSnapshot.docs.forEach((frDoc) => {
        const updateData: any = {};
        if (updates.displayName) updateData['toUser.displayName'] = updates.displayName;
        if (updates.avatar) updateData['toUser.avatar'] = updates.avatar;
        
        updatePromises.push(updateDoc(frDoc.ref, updateData));
      });

      // 4. 更新通知中的資訊
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('fromUserId', '==', userId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      
      notificationsSnapshot.docs.forEach((notifDoc) => {
        const updateData: any = {};
        if (updates.displayName) updateData['fromUser.displayName'] = updates.displayName;
        if (updates.avatar) updateData['fromUser.avatar'] = updates.avatar;
        
        updatePromises.push(updateDoc(notifDoc.ref, updateData));
      });

      // 批次執行所有更新
      await Promise.all(updatePromises);
      
      console.log(`✅ 已更新 ${updatePromises.length} 筆相關資料`);
    } catch (error) {
      console.error('批次更新用戶資訊失敗:', error);
      // 不拋出錯誤，因為主要的用戶資料已經更新成功
    }
  }

  // 取得用戶完整資料
  async getUserProfile(userId: string): Promise<UserInfo | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) return null;

      const data = userDoc.data();
      return {
        id: userDoc.id,
        username: data.username,
        displayName: data.displayName,
        avatar: data.avatar,
        bio: data.bio,
      } as UserInfo;
    } catch (error) {
      console.error('取得用戶資料失敗:', error);
      return null;
    }
  }

  // 檢查 username 是否已被使用
  async checkUsernameExists(username: string): Promise<boolean> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username),
        limit(1)
      );
      const snapshot = await getDocs(usersQuery);
      return !snapshot.empty;
    } catch (error) {
      console.error('檢查 username 失敗:', error);
      return true; // 發生錯誤時，保守起見返回 true
    }
  }

  // 通過 username 獲取用戶資料
  async getUserByUsername(username: string): Promise<UserInfo | null> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username),
        limit(1)
      );
      const snapshot = await getDocs(usersQuery);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        username: data.username,
        displayName: data.displayName,
        avatar: data.avatar,
        bio: data.bio,
        badge: data.badge,
        website: data.website,
      } as UserInfo;
    } catch (error) {
      console.error('通過 username 獲取用戶失敗:', error);
      return null;
    }
  }
}

export default new FirebaseService();
