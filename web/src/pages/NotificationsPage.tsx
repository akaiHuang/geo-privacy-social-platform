import React, { memo } from 'react';
import { Notification, FriendRequest } from '../types';

interface NotificationsPageProps {
  notifications: Notification[];
  friendRequests: FriendRequest[];
  onMarkAsRead: (id: string) => void;
  onAcceptRequest: (id: string) => void;
  onRejectRequest: (id: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = memo(({
  notifications,
  friendRequests,
  onMarkAsRead,
  onAcceptRequest,
  onRejectRequest,
}) => {
  return (
    <div className="notifications-container">
      {/* 通知內容 */}
    </div>
  );
});

NotificationsPage.displayName = 'NotificationsPage';
