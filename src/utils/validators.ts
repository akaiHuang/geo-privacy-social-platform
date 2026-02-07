export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateUsername = (username: string): boolean => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

export const validatePostContent = (content: string): boolean => {
  return content.trim().length > 0 && content.length <= 2000;
};

export const validateBio = (bio: string): boolean => {
  return bio.length <= 150;
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return '剛剛';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分鐘前`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}小時前`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}天前`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}週前`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}個月前`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}年前`;
};

export const formatCount = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1000000).toFixed(1)}M`;
};

export const truncateText = (text: string, maxLength: number): string => {
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
};
