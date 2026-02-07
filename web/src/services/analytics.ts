import { getAnalytics, logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import app from '../config/firebase';

// 初始化 Analytics
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// 用戶行為追蹤服務
class AnalyticsService {
  /**
   * 設置用戶 ID（登入時）
   * 用於關聯所有用戶行為
   */
  setUser(userId: string, userProperties?: {
    username?: string;
    displayName?: string;
    signUpDate?: string;
  }) {
    if (!analytics) return;
    
    try {
      setUserId(analytics, userId);
      
      if (userProperties) {
        setUserProperties(analytics, userProperties);
      }
      
      console.log('📊 Analytics: 用戶已設置', userId);
    } catch (error) {
      console.error('設置 Analytics 用戶失敗:', error);
    }
  }

  /**
   * 追蹤頁面瀏覽
   */
  trackPageView(pageName: string, additionalParams?: Record<string, any>) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'page_view', {
        page_name: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...additionalParams,
      });
      
      console.log('📊 Analytics: 頁面瀏覽', pageName);
    } catch (error) {
      console.error('追蹤頁面瀏覽失敗:', error);
    }
  }

  /**
   * 追蹤貼文互動
   */
  trackPostInteraction(action: 'like' | 'unlike' | 'comment' | 'favorite' | 'unfavorite', postId: string, postOwnerId?: string) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'post_interaction', {
        action,
        post_id: postId,
        post_owner_id: postOwnerId,
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics: 貼文互動', action, postId);
    } catch (error) {
      console.error('追蹤貼文互動失敗:', error);
    }
  }

  /**
   * 追蹤社交互動
   */
  trackSocialInteraction(action: 'send_friend_request' | 'accept_friend_request' | 'reject_friend_request', targetUserId: string) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'social_interaction', {
        action,
        target_user_id: targetUserId,
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics: 社交互動', action);
    } catch (error) {
      console.error('追蹤社交互動失敗:', error);
    }
  }

  /**
   * 追蹤內容創建
   */
  trackContentCreation(contentType: 'post' | 'comment' | 'reply', contentId: string, additionalParams?: Record<string, any>) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'content_creation', {
        content_type: contentType,
        content_id: contentId,
        ...additionalParams,
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics: 內容創建', contentType);
    } catch (error) {
      console.error('追蹤內容創建失敗:', error);
    }
  }

  /**
   * 追蹤地圖互動
   */
  trackMapInteraction(action: 'fly_to_post' | 'time_travel' | 'zoom' | 'pan', additionalParams?: Record<string, any>) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'map_interaction', {
        action,
        ...additionalParams,
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics: 地圖互動', action);
    } catch (error) {
      console.error('追蹤地圖互動失敗:', error);
    }
  }

  /**
   * 追蹤搜尋行為
   */
  trackSearch(searchTerm: string, resultCount?: number) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'search', {
        search_term: searchTerm,
        result_count: resultCount,
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics: 搜尋', searchTerm);
    } catch (error) {
      console.error('追蹤搜尋失敗:', error);
    }
  }

  /**
   * 追蹤用戶留存（會話開始）
   */
  trackSessionStart() {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'session_start', {
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics: 會話開始');
    } catch (error) {
      console.error('追蹤會話開始失敗:', error);
    }
  }

  /**
   * 追蹤轉換事件（重要行為）
   */
  trackConversion(eventName: string, value?: number, currency?: string) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, eventName, {
        value,
        currency,
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics: 轉換事件', eventName);
    } catch (error) {
      console.error('追蹤轉換事件失敗:', error);
    }
  }

  /**
   * 追蹤錯誤事件
   */
  trackError(errorType: string, errorMessage: string, errorStack?: string) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'app_error', {
        error_type: errorType,
        error_message: errorMessage,
        error_stack: errorStack,
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics: 錯誤事件', errorType);
    } catch (error) {
      console.error('追蹤錯誤事件失敗:', error);
    }
  }

  /**
   * 追蹤用戶參與度（停留時間）
   */
  trackEngagement(pageName: string, durationSeconds: number) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'user_engagement', {
        page_name: pageName,
        engagement_time_msec: durationSeconds * 1000,
        timestamp: new Date().toISOString(),
      });
      
      console.log('📊 Analytics: 用戶參與', pageName, durationSeconds);
    } catch (error) {
      console.error('追蹤用戶參與失敗:', error);
    }
  }

  /**
   * 清除用戶數據（登出時）
   */
  clearUser() {
    if (!analytics) return;
    
    try {
      setUserId(analytics, null);
      console.log('📊 Analytics: 用戶已清除');
    } catch (error) {
      console.error('清除 Analytics 用戶失敗:', error);
    }
  }
}

export default new AnalyticsService();
