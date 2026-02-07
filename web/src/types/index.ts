export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  birthday?: string; // ISO 8601 格式 (YYYY-MM-DD)
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  badge?: string; // 成就標籤/稱號
  website?: string; // 個人網站連結
  createdAt: Date;
}

export interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  badge?: string; // 在貼文和留言中也顯示標籤
  bio?: string; // 個人簡介
  website?: string; // 個人網站
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface Media {
  id: string;
  type: MediaType;
  uri: string;
  thumbnail?: string;
  duration?: number;
}

export interface Post {
  id: string;
  userId: string;
  user: UserInfo;
  content: string;
  media: Media[];
  location: Location;
  originalLocation?: Location;
  createdAt: Date;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isFavorited?: boolean;
  timeSlot?: string;
  expiresAt?: Date;
  isExpired?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: UserInfo;
  content: string;
  createdAt: Date;
}

export enum FriendRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUser: UserInfo;
  toUserId: string;
  toUser: UserInfo;
  status: FriendRequestStatus;
  createdAt: Date;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: Date;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPTED = 'friend_accepted',
  POST_LIKED = 'post_liked',
  POST_COMMENTED = 'post_commented',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  fromUserId: string;
  fromUser: UserInfo;
  postId?: string;
  commentId?: string;
  read: boolean;
  createdAt: Date;
}

export interface Favorite {
  id: string;
  userId: string;
  postId: string;
  post?: Post;
  createdAt: Date;
}

export interface ViewHistory {
  id: string;
  userId: string;
  postId: string;
  post?: Post;
  viewedAt: Date;
}
