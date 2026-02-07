// 應用配置常量

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  info: '#5AC8FA',
  
  background: '#FFFFFF',
  secondaryBackground: '#F2F2F7',
  tertiaryBackground: '#E5E5EA',
  
  text: '#000000',
  secondaryText: '#8E8E93',
  placeholderText: '#C7C7CC',
  
  border: '#C6C6C8',
  separator: '#E5E5EA',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

// 地圖配置
export const MAP_CONFIG = {
  defaultZoom: 15,
  locationOffsetKm: 2, // 位置隨機偏移量（公里）
  nearbyRadius: 10, // 附近貼文搜索半徑（公里）
};

// 媒體配置
export const MEDIA_CONFIG = {
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxVideoSize: 50 * 1024 * 1024, // 50MB
  maxVideoDuration: 60, // 秒
  maxMediaCount: 10, // 每個貼文最多媒體數量
  imageQuality: 0.8,
};

// 貼文配置
export const POST_CONFIG = {
  maxContentLength: 2000,
  maxBioLength: 150,
  pageSize: 20,
};

// API 配置
export const API_CONFIG = {
  baseURL: 'https://api.example.com', // 替換為實際 API 地址
  timeout: 30000,
};
