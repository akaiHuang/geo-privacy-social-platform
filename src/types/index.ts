export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt: Date;
}

export interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
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
  expiresAt?: Date;
  isExpired?: boolean;
  timeSlot?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: UserInfo;
  content: string;
  createdAt: Date;
}

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  Feed: undefined;
  Profile: { userId?: string };
  PostCreate: undefined;
  PostDetail: { postId: string };
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CreatePostRequest {
  content: string;
  media: Media[];
  location: Location;
}

// 用戶更新請求
export interface UpdateUserRequest {
  displayName?: string;
  bio?: string;
  avatar?: string;
}
