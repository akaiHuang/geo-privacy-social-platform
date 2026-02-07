import { useState, useEffect, useCallback } from 'react';
import FirebaseService from '../services/firebase';
import { Notification, FriendRequest } from '../types';

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const data = await FirebaseService.getNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('載入通知失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadFriendRequests = useCallback(async () => {
    if (!userId) return;
    
    try {
      // TODO: 需要實現 getFriendRequests 方法
      // const requests = await FirebaseService.getFriendRequests();
      // setFriendRequests(requests);
      setFriendRequests([]);
    } catch (error) {
      console.error('載入好友請求失敗:', error);
    }
  }, [userId]);

  // Realtime 監聽通知
  useEffect(() => {
    if (!userId) return;

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = FirebaseService.subscribeToNotifications((newNotifications) => {
        setNotifications(newNotifications);
        const unread = newNotifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
      });
    } catch (error) {
      console.error('訂閱通知失敗:', error);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await FirebaseService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('標記已讀失敗:', error);
    }
  }, []);

  const acceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      await FirebaseService.acceptFriendRequest(requestId);
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error('接受好友請求失敗:', error);
    }
  }, []);

  const rejectFriendRequest = useCallback(async (requestId: string) => {
    try {
      await FirebaseService.rejectFriendRequest(requestId);
      setFriendRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      console.error('拒絕好友請求失敗:', error);
    }
  }, []);

  return {
    notifications,
    friendRequests,
    unreadCount,
    loading,
    loadNotifications,
    loadFriendRequests,
    markAsRead,
    acceptFriendRequest,
    rejectFriendRequest,
  };
}
