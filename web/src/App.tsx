import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { MapboxView, MapboxViewRef } from './components/map/MapboxView';
import { TimelineSlider } from './components/TimelineSlider';
import { EditProfileModal } from './components/EditProfileModal';
import { FullscreenPostViewer } from './components/FullscreenPostViewer';
import { Loading } from './components/common/Loading';
import { ProfilePage } from './components/ProfilePage';
import AuthService from './services/auth';
import FirebaseService from './services/firebase';
import AnalyticsService from './services/analytics';
import { Post, User, UserInfo, Notification, FriendRequest, Favorite, ViewHistory } from './types';
import { linkify } from './utils/profileHelpers';
import './App.css';

// 相對時間格式化（類似 Instagram）
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 1) return '剛剛';
  if (diffInMinutes < 60) return `${diffInMinutes} 分鐘前`;
  if (diffInHours < 24) return `${diffInHours} 小時前`;
  if (diffInDays < 7) return `${diffInDays} 天前`;
  if (diffInWeeks < 4) return `${diffInWeeks} 週前`;
  if (diffInMonths < 12) return `${diffInMonths} 個月前`;
  return `${diffInYears} 年前`;
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]); // 保存所有貼文
  const [mapPosts, setMapPosts] = useState<Post[]>([]); // 地圖專用的時光回溯貼文
  const [currentView, setCurrentView] = useState<'feed' | 'map' | 'mapB' | 'profile' | 'notifications'>('feed');
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // Loading states for different views
  const [postsLoading, setPostsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Time travel states
  // const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  // Map refs
  const mapARef = useRef<MapboxViewRef>(null);
  const mapBRef = useRef<MapboxViewRef>(null);
  
  // 全螢幕查看器狀態（新版組件）
  const [showFullscreenViewer, setShowFullscreenViewer] = useState(false);
  const [fullscreenPostsList, setFullscreenPostsList] = useState<Post[]>([]);
  const [fullscreenInitialIndex, setFullscreenInitialIndex] = useState(0);
  
  // Notification states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  
  // Friend status cache
  const [friendStatuses, setFriendStatuses] = useState<{ [userId: string]: string }>({});
  
  // Favorites and History states
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewHistory[]>([]);
  const [profileTab, setProfileTab] = useState<'posts' | 'favorites' | 'history'>('posts');
  
  // Viewing other user's profile states (步驟2)
  const [viewingUser, setViewingUser] = useState<UserInfo | null>(null); // 正在查看的用戶（如果不是自己）
  const [viewingUserPosts, setViewingUserPosts] = useState<Post[]>([]); // 正在查看的用戶的貼文
  const [isViewingSelf, setIsViewingSelf] = useState(true); // 是否在查看自己的個人頁面
  
  // Create post states
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [postLocation, setPostLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [postSubmitting, setPostSubmitting] = useState(false);
  
  // Comment states
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [postComments, setPostComments] = useState<{ [key: string]: any[] }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});
  const [replyingTo, setReplyingTo] = useState<{ [key: string]: string | null }>({});
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  
  // Auth states
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneConfirmation, setPhoneConfirmation] = useState<any>(null);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Edit profile states
  const [showEditProfile, setShowEditProfile] = useState(false);

  useEffect(() => {
    let unsubscribeNotifications: (() => void) | null = null;
    
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      setIsAuthenticated(!!firebaseUser);
      if (firebaseUser) {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
        
        loadPosts();
        loadNotifications();
        loadFriendRequests();
        loadFavorites();
        loadViewHistory();
        
        // 訂閱即時通知
        try {
          unsubscribeNotifications = FirebaseService.subscribeToNotifications((newNotifications) => {
            setNotifications(newNotifications);
            const unread = newNotifications.filter(n => !n.read).length;
            setUnreadCount(unread);
          });
        } catch (error) {
          console.error('訂閱通知失敗:', error);
        }
      } else {
        // 登出時清理訂閱
        if (unsubscribeNotifications) {
          unsubscribeNotifications();
          unsubscribeNotifications = null;
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubscribeNotifications) {
        unsubscribeNotifications();
      }
    };
  }, []);

  // 監控視圖切換
  useEffect(() => {
    // 追蹤頁面瀏覽
    const pageNames: Record<typeof currentView, string> = {
      'feed': '動態牆',
      'map': '地圖A',
      'mapB': '地圖B',
      'profile': '個人頁面',
      'notifications': '通知中心'
    };
    AnalyticsService.trackPageView(pageNames[currentView]);
    
    // console.log('📺 視圖切換到:', currentView);
    if (currentView === 'map') {
      // console.log('🗺️ 地圖視圖載入中...');
      // 延遲一點再次檢查地圖是否正確載入
      // setTimeout(() => {
      //   const mapContainer = document.querySelector('.leaflet-map-view');
      //   const mapPosts = document.querySelector('.map-posts');
      //   const markers = document.querySelectorAll('.custom-marker');
      //   // console.log('🔍 地圖容器:', mapContainer ? '找到' : '未找到');
      //   // console.log('🔍 地圖側邊欄:', mapPosts ? '找到' : '未找到');
      //   // console.log('🔍 標記數量:', markers.length);
      //   if (mapContainer) {
      //     const rect = mapContainer.getBoundingClientRect();
      //     // console.log('🔍 地圖尺寸:', { width: rect.width, height: rect.height });
      //   }
      // }, 500);
    }
  }, [currentView]);

  // 監聽 URL 變化，同步個人頁面狀態（步驟2：區分自己 vs 他人）
  useEffect(() => {
    // 如果 URL 是 /u/username，自動切換到個人頁面視圖
    if (location.pathname.startsWith('/u/') && user) {
      const urlUsername = location.pathname.split('/u/')[1];
      
      if (urlUsername === user.username) {
        // 查看自己的個人頁面
        setIsViewingSelf(true);
        setViewingUser(null);
        setViewingUserPosts([]);
        if (currentView !== 'profile') {
          setCurrentView('profile');
        }
      } else {
        // 查看其他用戶的個人頁面（步驟2）
        setIsViewingSelf(false);
        // 安全性：重置為貼文標籤，防止嘗試查看他人的收藏或歷史
        setProfileTab('posts');
        if (currentView !== 'profile') {
          setCurrentView('profile');
        }
        
        // 載入其他用戶的資料
        const loadOtherUserProfile = async () => {
          try {
            const otherUser = await FirebaseService.getUserByUsername(urlUsername);
            if (otherUser) {
              setViewingUser(otherUser);
              // 載入該用戶的貼文（公開資料）
              const userPosts = await FirebaseService.getUserPosts(otherUser.id);
              setViewingUserPosts(userPosts);
            } else {
              console.error('用戶不存在:', urlUsername);
              // 可以顯示 404 或跳轉回首頁
            }
          } catch (error) {
            console.error('載入用戶資料失敗:', error);
          }
        };
        
        loadOtherUserProfile();
      }
    } else if (location.pathname === '/' && currentView === 'profile') {
      // 如果 URL 回到首頁但 currentView 還是 profile，切回 feed
      setIsViewingSelf(true);
      setViewingUser(null);
      setViewingUserPosts([]);
      setCurrentView('feed');
    }
  }, [location, user, currentView]);

  // 當切換到地圖B時，重新計算地圖大小
  useEffect(() => {
    if (currentView === 'mapB') {
      // 延遲執行以確保 DOM 已更新
      const timer = setTimeout(() => {
        if (mapBRef.current) {
          mapBRef.current.resize();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  // 🔄 Realtime 監聽貼文更新
  useEffect(() => {
    if (!user) return;

    // console.log('🔄 開始 Realtime 監聽貼文...');
    const unsubscribe = FirebaseService.subscribeToPostsRealtime(50, async (fetchedPosts) => {
      // console.log('🔄 [Realtime] 收到 posts 更新，數量:', fetchedPosts.length);
      
      setPosts(prevPosts => {
        // 如果是初次載入（沒有 posts），需要檢查 isLiked 和 isFavorited
        if (prevPosts.length === 0) {
          // console.log('� [Realtime] 初次載入，需要檢查狀態...');
          // 這裡先暫時不檢查，讓 loadPosts 去做
          return prevPosts;
        }
        
        // 否則，只更新 likes/comments 等數值，保留 isLiked/isFavorited 的本地狀態
        const mergedPosts = fetchedPosts.map(newPost => {
          const existingPost = prevPosts.find(p => p.id === newPost.id);
          if (existingPost) {
            // console.log(`🔄 [Realtime] 合併 ${existingPost.id.slice(0, 8)}: 保留本地 isLiked=${existingPost.isLiked}, isFavorited=${existingPost.isFavorited}, 更新 likes=${newPost.likes}`);
            // 🔑 關鍵：保留本地的 isLiked 和 isFavorited，只更新其他欄位
            return {
              ...newPost,
              isLiked: existingPost.isLiked, // 保留本地樂觀更新
              isFavorited: existingPost.isFavorited, // 保留本地樂觀更新
            };
          }
          // 新貼文（比如別人發布的），需要檢查狀態
          return newPost;
        });
        
        // console.log('✅ [Realtime] posts 已更新（保留本地狀態）');
        return mergedPosts;
      });
    });

    // 清理函數：組件卸載時取消訂閱
    return () => {
      // console.log('🛑 取消 Realtime 監聽');
      unsubscribe();
    };
  }, [user]);

  // 🔔 Realtime 監聽通知更新
  useEffect(() => {
    if (!user) return;

    // console.log('🔔 開始 Realtime 監聽通知...');
    const unsubscribe = FirebaseService.subscribeToNotificationsRealtime(50, (fetchedNotifications) => {
      // console.log('🔔 收到 Realtime 更新，通知數量:', fetchedNotifications.length);
      setNotifications(fetchedNotifications);
      const unread = fetchedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      // console.log('✅ Realtime 通知已更新到 state，未讀數量:', unread);
    });

    return () => {
      // console.log('🛑 取消通知 Realtime 監聽');
      unsubscribe();
    };
  }, [user]);

  // 👀 監聽 posts state 的變化
  useEffect(() => {
    // console.log('📊 [狀態變化] posts state 已更新，數量:', posts.length);
    if (posts.length > 0) {
      // console.log('📊 [狀態變化] 第一則貼文資訊:');
      // console.log('   - id:', posts[0].id.slice(0, 8));
      // console.log('   - isLiked:', posts[0].isLiked);
      // console.log('   - isFavorited:', posts[0].isFavorited);
      // console.log('   - likes:', posts[0].likes);
    }
  }, [posts]);

  const loadPosts = async () => {
    // console.log('📥 開始載入 posts...');
    setPostsLoading(true);
    const fetchedPosts = await FirebaseService.getPosts(50);
    // console.log('📥 載入完成，posts 數量:', fetchedPosts.length);
    
    // 檢查每個貼文的收藏狀態和按讚狀態
    const postsWithStates = await Promise.all(
      fetchedPosts.map(async (post) => {
        const [isFavorited, isLiked] = await Promise.all([
          FirebaseService.isFavorited(post.id),
          FirebaseService.checkIfLiked(post.id)
        ]);
        // console.log(`📊 Post ${post.id.slice(0, 8)}: isFavorited=${isFavorited}, isLiked=${isLiked}`);
        return { ...post, isFavorited, isLiked };
      })
    );
    
    // console.log('📥 所有貼文狀態檢查完成，設定 posts...');
    setAllPosts(postsWithStates); // 保存所有貼文
    setPosts(postsWithStates); // Feed 和 Profile 使用
    setMapPosts(postsWithStates); // 地圖初始也顯示所有貼文
    // console.log('✅ posts 已更新到 state');
    setPostsLoading(false);
  };

  // 新的時間軸處理邏輯：根據百分比（0-1）來分配貼文
  // percentage: 0 = 最新，1 = 最舊
  const handleTimelinePosition = useCallback((percentage: number) => {
    console.log(`⏰ 時間軸位置: ${(percentage * 100).toFixed(1)}%`);
    
    if (allPosts.length === 0) {
      setMapPosts([]);
      console.log(`  └─ 沒有貼文`);
      return;
    }

    // 按時間排序（最新到最舊）
    const sortedPosts = [...allPosts].sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    // 找出最新和最舊的文章時間
    const newestTime = sortedPosts[0].createdAt instanceof Date 
      ? sortedPosts[0].createdAt.getTime() 
      : new Date(sortedPosts[0].createdAt).getTime();
    
    const oldestTime = sortedPosts[sortedPosts.length - 1].createdAt instanceof Date
      ? sortedPosts[sortedPosts.length - 1].createdAt.getTime()
      : new Date(sortedPosts[sortedPosts.length - 1].createdAt).getTime();

    const timeRange = newestTime - oldestTime;

    console.log(`  └─ 文章時間範圍: ${new Date(oldestTime).toLocaleString()} ~ ${new Date(newestTime).toLocaleString()}`);
    console.log(`  └─ 時間跨度: ${(timeRange / (1000 * 60 * 60)).toFixed(2)} 小時`);

    if (percentage === 1) {
      // percentage = 1 代表頂部，顯示所有貼文（最新）
      setMapPosts(sortedPosts);
      console.log(`  └─ 顯示全部 ${sortedPosts.length} 篇貼文`);
      return;
    }

    // 平均分散模式：將文章平均分配到時間軸上
    // percentage: 1 = 最新（頂部），0 = 最舊（底部）
    // 反轉 percentage 來計算區段索引
    const totalPosts = sortedPosts.length;
    const postsPerSection = Math.max(1, Math.ceil(totalPosts / 10)); // 分成10個區段
    const sectionIndex = Math.min(Math.floor((1 - percentage) * 10), 9); // 反轉：1 → 0，0 → 9
    
    const startIdx = sectionIndex * postsPerSection;
    const endIdx = Math.min(startIdx + postsPerSection, totalPosts);
    const selectedPosts = sortedPosts.slice(startIdx, endIdx);

    setMapPosts(selectedPosts);
    console.log(`  └─ 區段 ${sectionIndex}/10, 顯示貼文 [${startIdx}-${endIdx}] 共 ${selectedPosts.length} 篇`);
  }, [allPosts]);

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    const fetchedNotifications = await FirebaseService.getNotifications();
    setNotifications(fetchedNotifications);
    const unread = fetchedNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    setNotificationsLoading(false);
  };

  const loadFriendRequests = async () => {
    const requests = await FirebaseService.getPendingFriendRequests();
    setFriendRequests(requests);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'email') {
        if (isLogin) {
          const result = await AuthService.login(email, password);
          if (!result.success) {
            setAuthError(result.error || '登入失敗');
          }
        } else {
          if (!username || !displayName) {
            setAuthError('請填寫所有欄位');
            setAuthLoading(false);
            return;
          }
          const result = await AuthService.register(email, password, username, displayName);
          if (!result.success) {
            setAuthError(result.error || '註冊失敗');
          }
        }
      } else {
        // 手機登入
        if (!phoneConfirmation) {
          // 發送驗證碼
          const result = await AuthService.sendPhoneVerification(phoneNumber, 'recaptcha-container');
          if (result.success && result.confirmation) {
            setPhoneConfirmation(result.confirmation);
            setAuthError('驗證碼已發送！');
          } else {
            setAuthError(result.error || '發送驗證碼失敗');
          }
        } else {
          // 驗證驗證碼
          const result = await AuthService.verifyPhoneCode(
            phoneConfirmation,
            verificationCode,
            isLogin ? undefined : username,
            isLogin ? undefined : displayName
          );
          if (!result.success) {
            setAuthError(result.error || '驗證失敗');
          }
        }
      }
    } catch (err) {
      setAuthError('發生錯誤，請稍後再試');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setPosts([]);
  };

  const handleProfileUpdate = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
    // 重新載入貼文以更新所有貼文中的使用者資訊
    loadPosts();
  };

  const handleLike = async (postId: string) => {
    // console.log('❤️ [handleLike] 開始處理按讚，postId:', postId);
    
    // 樂觀更新 UI：先立即更新本地狀態
    const updatePost = (p: Post) => {
      if (p.id === postId) {
        const newIsLiked = !p.isLiked;
        const newLikes = newIsLiked ? p.likes + 1 : Math.max(0, p.likes - 1);
        return { 
          ...p, 
          isLiked: newIsLiked,
          likes: newLikes
        };
      }
      return p;
    };
    
    setPosts(prevPosts => prevPosts.map(updatePost));
    setAllPosts(prevPosts => prevPosts.map(updatePost));
    setMapPosts(prevPosts => prevPosts.map(updatePost));
    setFullscreenPostsList(prevPosts => prevPosts.map(updatePost));
    
    // 背景同步到 Firebase（realtime listener 會自動更新）
    await FirebaseService.toggleLike(postId);
    // // console.log('❤️ [handleLike] toggleLike 結果:', result);
  };

  const handleFavorite = async (postId: string) => {
    // console.log('⭐ [handleFavorite] 開始處理收藏，postId:', postId);
    
    // 樂觀更新 UI：先立即更新本地狀態
    const updatePost = (p: Post) => {
      if (p.id === postId) {
        const newIsFavorited = !p.isFavorited;
        return { ...p, isFavorited: newIsFavorited };
      }
      return p;
    };
    
    setPosts(prevPosts => prevPosts.map(updatePost));
    setAllPosts(prevPosts => prevPosts.map(updatePost));
    setMapPosts(prevPosts => prevPosts.map(updatePost));
    setFullscreenPostsList(prevPosts => prevPosts.map(updatePost));
    
    // 背景同步到 Firebase（realtime listener 會自動更新）
    await FirebaseService.toggleFavorite(postId);
    // // console.log('⭐ [handleFavorite] toggleFavorite 結果:', result);
    
    // 收藏列表需要手動重新載入
    await loadFavorites();
    // // console.log('⭐ favorites 已重新載入');
  };

  const handleCommentAdded = async (postId: string) => {
    // 更新留言數
    const updatePost = (p: Post) => {
      if (p.id === postId) {
        return { ...p, comments: p.comments + 1 };
      }
      return p;
    };
    
    setPosts(prevPosts => prevPosts.map(updatePost));
    setFullscreenPostsList(prevPosts => prevPosts.map(updatePost));
  };

  const loadFavorites = async () => {
    if (!user) return;
    // 安全性檢查：只能載入自己的收藏
    if (!isViewingSelf) {
      console.warn('安全性警告：嘗試載入他人的收藏資料');
      return;
    }
    setProfileLoading(true);
    const favs = await FirebaseService.getFavorites(user.id);
    setFavorites(favs);
    setProfileLoading(false);
  };

  const loadViewHistory = async () => {
    if (!user) return;
    // 安全性檢查：只能載入自己的歷史記錄
    if (!isViewingSelf) {
      console.warn('安全性警告：嘗試載入他人的歷史記錄');
      return;
    }
    setProfileLoading(true);
    const history = await FirebaseService.getViewHistory(user.id);
    setViewHistory(history);
    setProfileLoading(false);
  };

  // @ts-ignore - Function kept for future features
  const handleAddComment = async (postId: string, parentCommentId?: string) => {
    const commentText = parentCommentId 
      ? replyTexts[parentCommentId]?.trim() 
      : commentTexts[postId]?.trim();
      
    if (!commentText) {
      alert('請輸入評論內容');
      return;
    }

    const result = await FirebaseService.addComment(postId, commentText, parentCommentId);
    if (result.success) {
      // 清空輸入框
      if (parentCommentId) {
        setReplyTexts({ ...replyTexts, [parentCommentId]: '' });
        setReplyingTo({ ...replyingTo, [postId]: null });
      } else {
        setCommentTexts({ ...commentTexts, [postId]: '' });
      }
      // 重新載入評論
      const comments = await FirebaseService.getComments(postId);
      setPostComments({ ...postComments, [postId]: comments });
      // 重新載入貼文以更新評論數
      loadPosts();
    } else {
      alert('評論失敗：' + result.error);
    }
  };

  // @ts-ignore - Function kept for future features
  const toggleComments = async (postId: string) => {
    const isOpening = !showComments[postId];
    setShowComments({ ...showComments, [postId]: isOpening });
    
    // 如果是打開評論區且還沒載入過評論，則載入評論
    if (isOpening && !postComments[postId]) {
      setLoadingComments({ ...loadingComments, [postId]: true });
      const comments = await FirebaseService.getComments(postId);
      setPostComments({ ...postComments, [postId]: comments });
      setLoadingComments({ ...loadingComments, [postId]: false });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPostLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          alert('無法取得位置：' + error.message);
        }
      );
    } else {
      alert('您的瀏覽器不支援定位功能');
    }
  };

  const handleCreatePost = async () => {
    // 必須要有圖片
    if (!postImage) {
      alert('請上傳圖片');
      return;
    }

    if (!postLocation) {
      alert('請先取得位置');
      return;
    }

    setPostSubmitting(true);

    try {
      const mediaFiles = postImage ? [postImage] : [];
      
      const locationData = {
        latitude: postLocation.latitude,
        longitude: postLocation.longitude,
        address: '網頁版發布',
      };

      // 創建貼文
      const result = await FirebaseService.createPost(
        postContent,
        mediaFiles,
        locationData
      );

      if (result.success) {
        // 重置表單
        setPostContent('');
        setPostImage(null);
        setPostImagePreview(null);
        setPostLocation(null);
        setShowCreatePost(false);
        
        // 延遲一下再重新載入，確保 Firestore 寫入完成
        setTimeout(async () => {
          await loadPosts();
          alert('貼文發布成功！');
        }, 500);
      } else {
        alert('發布貼文失敗：' + result.error);
      }
    } catch (error) {
      console.error('發布貼文失敗:', error);
      alert('發布貼文失敗，請稍後再試');
    } finally {
      setPostSubmitting(false);
    }
  };

  // ========== 好友功能 ==========

  const getFriendStatus = async (userId: string) => {
    const status = await FirebaseService.getFriendshipStatus(userId);
    setFriendStatuses({ ...friendStatuses, [userId]: status });
    return status;
  };

  // @ts-ignore - Function kept for future features
  const handleSendFriendRequest = async (userId: string) => {
    const result = await FirebaseService.sendFriendRequest(userId);
    if (result.success) {
      alert('好友請求已發送');
      await getFriendStatus(userId);
    } else {
      alert(result.message || '發送失敗');
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    const result = await FirebaseService.acceptFriendRequest(requestId);
    if (result.success) {
      alert('已接受好友請求');
      await loadFriendRequests();
      await loadNotifications();
    } else {
      alert(result.message || '接受失敗');
    }
  };

  const handleRejectFriendRequest = async (requestId: string) => {
    const result = await FirebaseService.rejectFriendRequest(requestId);
    if (result.success) {
      alert('已拒絕好友請求');
      await loadFriendRequests();
    } else {
      alert(result.message || '拒絕失敗');
    }
  };

  // @ts-ignore - Function kept for future features
  const handleBlockUser = async (userId: string) => {
    if (confirm('確定要封鎖此用戶嗎？')) {
      const result = await FirebaseService.blockUser(userId);
      if (result.success) {
        alert('已封鎖用戶');
        await getFriendStatus(userId);
      } else {
        alert(result.message || '封鎖失敗');
      }
    }
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    await FirebaseService.markNotificationAsRead(notificationId);
    await loadNotifications();
  };

  const handleMarkAllNotificationsAsRead = async () => {
    await FirebaseService.markAllNotificationsAsRead();
    await loadNotifications();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1 className="auth-title">🗺️ BroBro</h1>
          <p className="auth-subtitle">地圖交友平台</p>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(true);
                setAuthError('');
                setPhoneConfirmation(null);
              }}
            >
              登入
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => {
                setIsLogin(false);
                setAuthError('');
                setPhoneConfirmation(null);
              }}
            >
              註冊
            </button>
          </div>

          <div className="auth-mode-tabs">
            <button
              type="button"
              className={`mode-tab ${authMode === 'email' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('email');
                setAuthError('');
                setPhoneConfirmation(null);
              }}
            >
              📧 Email
            </button>
            <button
              type="button"
              className={`mode-tab ${authMode === 'phone' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('phone');
                setAuthError('');
                setPhoneConfirmation(null);
              }}
            >
              📱 手機
            </button>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {authMode === 'email' ? (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                />
                <input
                  type="password"
                  placeholder="密碼 (至少 6 個字元)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="auth-input"
                />

                {!isLogin && (
                  <>
                    <input
                      type="text"
                      placeholder="使用者名稱"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="auth-input"
                    />
                    <input
                      type="text"
                      placeholder="顯示名稱"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="auth-input"
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <input
                  type="tel"
                  placeholder="手機號碼 (例如: +886912345678)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="auth-input"
                  disabled={!!phoneConfirmation}
                />

                {phoneConfirmation && (
                  <input
                    type="text"
                    placeholder="驗證碼"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    className="auth-input"
                    maxLength={6}
                  />
                )}

                {!isLogin && !phoneConfirmation && (
                  <>
                    <input
                      type="text"
                      placeholder="使用者名稱"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="auth-input"
                    />
                    <input
                      type="text"
                      placeholder="顯示名稱"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="auth-input"
                    />
                  </>
                )}
              </>
            )}

            <div id="recaptcha-container"></div>

            {authError && <div className="auth-error">{authError}</div>}

            <button type="submit" disabled={authLoading} className="auth-button">
              {authLoading ? '處理中...' : 
                authMode === 'phone' ? 
                  (phoneConfirmation ? '驗證' : '發送驗證碼') :
                  (isLogin ? '登入' : '註冊')
              }
            </button>

            {phoneConfirmation && (
              <button
                type="button"
                onClick={() => {
                  setPhoneConfirmation(null);
                  setVerificationCode('');
                  setAuthError('');
                }}
                className="btn-secondary"
                style={{ marginTop: '0.5rem' }}
              >
                重新發送驗證碼
              </button>
            )}
          </form>

          {isLogin && (
            <>
              <div className="auth-divider">
                <span>或</span>
              </div>

              <div className="social-auth">
                <button
                  type="button"
                  onClick={async () => {
                    setAuthLoading(true);
                    const result = await AuthService.loginWithGoogle();
                    if (!result.success) {
                      setAuthError(result.error || 'Google 登入失敗');
                    }
                    setAuthLoading(false);
                  }}
                  disabled={authLoading}
                  className="social-button google"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.55 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  使用 Google 登入
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setAuthLoading(true);
                    const result = await AuthService.loginWithApple();
                    if (!result.success) {
                      setAuthError(result.error || 'Apple 登入失敗');
                    }
                    setAuthLoading(false);
                  }}
                  disabled={authLoading}
                  className="social-button apple"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="currentColor" d="M14.94 5.19A4.38 4.38 0 0 0 16 2.59a4.44 4.44 0 0 0-2.87 1.47 4.18 4.18 0 0 0-1 2.52 3.75 3.75 0 0 0 2.81-1.39zM12 18c1.27 0 1.83-.86 3.41-.86 1.61 0 2 .84 3.44.84 1.41 0 2.42-1.31 3.34-2.59a13.53 13.53 0 0 0 1.52-3.13 4.29 4.29 0 0 1-2.56-3.94 4.36 4.36 0 0 1 2.14-3.75 4.51 4.51 0 0 0-3.53-1.91c-1.47 0-2.6.89-3.29.89-.72 0-1.82-.87-3.05-.87A4.8 4.8 0 0 0 9 4.44a5.88 5.88 0 0 0-1.31 4c0 3.23 1.94 7.56 4.31 7.56z"/>
                  </svg>
                  使用 Apple 登入
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🗺️ BroBro</h1>
        <div className="header-actions">
          <button 
            onClick={() => {
              setCurrentView('map');
              if (location.pathname !== '/') {
                navigate('/', { replace: true });
              }
            }}
            className={currentView === 'map' ? 'active' : ''}
          >
            🗺️ 地圖A
          </button>
          <button 
            onClick={() => {
              setCurrentView('mapB');
              if (location.pathname !== '/') {
                navigate('/', { replace: true });
              }
            }}
            className={currentView === 'mapB' ? 'active' : ''}
          >
            🗺️ 地圖B
          </button>
          <button 
            onClick={() => {
              setCurrentView('feed');
              if (location.pathname !== '/') {
                navigate('/', { replace: true });
              }
            }}
            className={currentView === 'feed' ? 'active' : ''}
          >
            📰 動態
          </button>
          <button 
            onClick={() => {
              setCurrentView('notifications');
              if (location.pathname !== '/') {
                navigate('/', { replace: true });
              }
            }}
            className={currentView === 'notifications' ? 'active' : ''}
          >
            🔔 通知 {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          <button 
            onClick={() => {
              if (user) {
                setCurrentView('profile');
                navigate(`/u/${user.username}`, { replace: true, state: { fromInternal: true } });
              }
            }}
            className={currentView === 'profile' ? 'active' : ''}
          >
            👤 個人
          </button>
          <button onClick={() => setShowCreatePost(true)} className="btn-create">
            ✏️ 發文
          </button>
          <button onClick={handleLogout} className="btn-logout">登出</button>
        </div>
      </header>

      <main className="app-main">
        {(() => {
          if (currentView === 'map') {
            // console.log('🗺️ 地圖視圖渲染中');
            // console.log('📍 Posts 數量:', posts.length);
            if (posts.length > 0) {
              // console.log('📍 第一個 post 的位置:', posts[0].location);
              // console.log('📍 地圖中心:', [posts[0].location.latitude, posts[0].location.longitude]);
            } else {
              // console.log('📍 沒有 posts，使用預設中心: [25.0330, 121.5654]');
            }
          }
          return null;
        })()}
        {currentView === 'map' ? (
          <div className="map-container">
            <MapboxView 
              ref={mapARef}
              posts={mapPosts}
              onMarkerClick={(postId) => {
                // console.log('🖱️ 標記被點擊:', postId);
                const postElement = document.getElementById(`post-${postId}`);
                if (postElement) {
                  postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              center={mapPosts.length > 0 ? [mapPosts[0].location.longitude, mapPosts[0].location.latitude] : undefined}
            />
            
            {/* 時間軸 - 純視覺刻度，文章時間動態計算 */}
            <TimelineSlider 
              onPositionChange={handleTimelinePosition}
            />
            
            <div className="map-posts">
              <h3>附近的貼文</h3>
              {mapPosts.map((post) => (
                <div 
                  key={post.id} 
                  id={`post-${post.id}`} 
                  className="mini-post-card"
                  onClick={() => {
                    console.log('🔍 貼文被點擊，地圖飛往:', post.id);
                    mapARef.current?.flyToPost(post.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="mini-post-header">
                    <div className="mini-user-info">
                      <div className="mini-avatar">
                        {post.user.avatar ? (
                          <img src={post.user.avatar} alt={post.user.displayName} />
                        ) : (
                          post.user.displayName.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="mini-user-name">{post.user.displayName}</div>
                        <div className="mini-location">
                          📍 {post.location.latitude.toFixed(4)}, {post.location.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {post.media.length > 0 && (
                    <img src={post.media[0].uri} alt="Post" className="mini-post-image" />
                  )}
                  <div className="mini-post-content">{post.content}</div>
                  <div className="mini-post-stats">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(post.id);
                      }}
                      className={`mini-like-btn ${post.isLiked ? 'liked' : ''}`}
                    >
                      {post.isLiked ? '❤️' : '🤍'} {post.likes}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const index = mapPosts.findIndex(p => p.id === post.id);
                        if (index !== -1) {
                          setFullscreenPostsList(mapPosts);
                          setFullscreenInitialIndex(index);
                          setShowFullscreenViewer(true);
                        }
                      }}
                      className="mini-comment-btn"
                    >
                      💬 {post.comments}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(post.id);
                      }}
                      className={`mini-favorite-btn ${post.isFavorited ? 'favorited' : ''}`}
                    >
                      <span className="star-icon">{post.isFavorited ? '⭐' : '☆'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : currentView === 'mapB' ? (
          <div className="map-b-container">
            {/* 地圖 B - 無側邊欄，點擊地標全螢幕顯示 */}
            <MapboxView 
              ref={mapBRef}
              posts={mapPosts}
              onMarkerClick={(postId) => {
                const index = mapPosts.findIndex(p => p.id === postId);
                if (index !== -1) {
                  setFullscreenPostsList(mapPosts);
                  setFullscreenInitialIndex(index);
                  setShowFullscreenViewer(true);
                }
              }}
              center={mapPosts.length > 0 ? [mapPosts[0].location.longitude, mapPosts[0].location.latitude] : undefined}
            />
            
            {/* 時間軸 - 純視覺刻度，文章時間動態計算 */}
            <TimelineSlider 
              onPositionChange={handleTimelinePosition}
            />
          </div>
        ) : currentView === 'feed' ? (
          <div className="feed-container">
            {/* 動態牆 - 顯示所有用戶的貼文 */}
            {/* TODO: 實作推薦演算法模組 - 根據用戶興趣、互動記錄等因素排序貼文 */}
            {/* 演算法考慮因素：
                1. 用戶與貼文作者的互動頻率
                2. 貼文的熱門程度（讚數、留言數）
                3. 貼文的時間新鮮度
                4. 用戶的興趣標籤匹配
                5. 地理位置相關性
            */}
            {postsLoading ? (
              <Loading text="載入貼文中..." size="large" />
            ) : posts.length === 0 ? (
              <div className="no-posts">
                <p>還沒有任何貼文</p>
                <p>🎉 成為第一個發文的人！</p>
              </div>
            ) : (
              <div className="feed-posts-grid">
                {posts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="feed-post-item"
                    onClick={() => {
                      setFullscreenPostsList(posts);
                      setFullscreenInitialIndex(index);
                      setShowFullscreenViewer(true);
                    }}
                  >
                    {post.media.length > 0 ? (
                      <img src={post.media[0].uri} alt="Post" />
                    ) : (
                      <div className="feed-post-content">
                        <p>{post.content}</p>
                      </div>
                    )}
                    <div className="feed-post-overlay">
                      <div className="overlay-stats">
                        <span>❤️ {post.likes}</span>
                        <span>💬 {post.comments}</span>
                      </div>
                      <div className="overlay-user">
                        @{post.user.username}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : currentView === 'notifications' ? (
          <div className="notifications-container">
            <div className="notifications-header">
              <h2>🔔 通知</h2>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllNotificationsAsRead} className="btn-small">
                  全部標為已讀
                </button>
              )}
            </div>

            {notificationsLoading ? (
              <Loading text="載入通知中..." size="medium" />
            ) : (
              <>
                {friendRequests.length > 0 && (
              <div className="friend-requests-section">
                <h3>好友請求</h3>
                {friendRequests.map((request) => (
                  <div key={request.id} className="notification-item friend-request">
                    <div className="notification-avatar">
                      {request.fromUser.avatar ? (
                        <img src={request.fromUser.avatar} alt={request.fromUser.displayName} />
                      ) : (
                        request.fromUser.displayName.charAt(0)
                      )}
                    </div>
                    <div className="notification-content">
                      <p>
                        <strong>{request.fromUser.displayName}</strong> 想加你為好友
                      </p>
                      <span className="notification-time">{getRelativeTime(new Date(request.createdAt))}</span>
                    </div>
                    <div className="notification-actions">
                      <button
                        onClick={() => handleAcceptFriendRequest(request.id)}
                        className="btn-small btn-primary"
                      >
                        接受
                      </button>
                      <button
                        onClick={() => handleRejectFriendRequest(request.id)}
                        className="btn-small btn-secondary"
                      >
                        拒絕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="notifications-list">
              <h3>所有通知</h3>
              {notifications.length === 0 ? (
                <div className="no-notifications">
                  <p>沒有通知</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    onClick={() => !notification.read && handleMarkNotificationAsRead(notification.id)}
                  >
                    <div className="notification-avatar">
                      {notification.fromUser.avatar ? (
                        <img src={notification.fromUser.avatar} alt={notification.fromUser.displayName} />
                      ) : (
                        notification.fromUser.displayName.charAt(0)
                      )}
                    </div>
                    <div className="notification-content">
                      <p>
                        <strong>{notification.fromUser.displayName}</strong>{' '}
                        {notification.type === 'friend_request' && '想加你為好友'}
                        {notification.type === 'friend_accepted' && '接受了你的好友請求'}
                        {notification.type === 'post_liked' && '按了你的貼文讚'}
                        {notification.type === 'post_commented' && '評論了你的貼文'}
                      </p>
                      <span className="notification-time">{getRelativeTime(new Date(notification.createdAt))}</span>
                    </div>
                    {!notification.read && <div className="unread-indicator"></div>}
                  </div>
                ))
              )}
            </div>
              </>
            )}
          </div>
        ) : (
          <div className="profile-container">
            {user && (
              <>
                {/* 個人資料頭部 - 步驟2：區分自己 vs 他人 */}
                <div className="profile-header">
                  <div className="profile-avatar-large">
                    {(isViewingSelf ? user.avatar : viewingUser?.avatar) ? (
                      <img src={isViewingSelf ? user.avatar! : viewingUser!.avatar!} alt={isViewingSelf ? user.displayName : viewingUser!.displayName} />
                    ) : (
                      (isViewingSelf ? user.displayName : viewingUser?.displayName || '?').charAt(0)
                    )}
                  </div>
                  <div className="profile-info">
                    <div className="profile-name-row">
                      <h3>
                        {isViewingSelf ? user.displayName : viewingUser?.displayName}
                        {(isViewingSelf ? user.badge : viewingUser?.badge) && (
                          <span className="profile-badge">{isViewingSelf ? user.badge : viewingUser?.badge}</span>
                        )}
                      </h3>
                      {isViewingSelf ? (
                        // 查看自己：顯示編輯按鈕
                        <button 
                          className="edit-profile-btn"
                          onClick={() => setShowEditProfile(true)}
                          title="編輯個人資料"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          編輯個人資料
                        </button>
                      ) : (
                        // 查看他人：顯示追蹤按鈕（步驟2-2）
                        <button 
                          className="follow-btn"
                          onClick={() => {
                            // TODO: 實現追蹤功能
                            console.log('追蹤用戶:', viewingUser?.username);
                          }}
                          title="追蹤"
                        >
                          ➕ 追蹤
                        </button>
                      )}
                    </div>
                    <p className="profile-username">@{isViewingSelf ? user.username : viewingUser?.username}</p>
                    {(isViewingSelf ? user.bio : viewingUser?.bio) && (
                      <div 
                        className="profile-bio" 
                        dangerouslySetInnerHTML={{ __html: linkify(isViewingSelf ? user.bio! : viewingUser!.bio!) }}
                      />
                    )}
                    {(isViewingSelf ? user.website : viewingUser?.website) && (
                      <a 
                        href={(isViewingSelf ? user.website! : viewingUser!.website!).startsWith('http') 
                          ? (isViewingSelf ? user.website! : viewingUser!.website!) 
                          : `https://${isViewingSelf ? user.website : viewingUser?.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-website"
                      >
                        🔗 {(isViewingSelf ? user.website! : viewingUser!.website!).replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                  <div className="profile-stats">
                    <div className="stat-item">
                      <span className="stat-number">
                        {isViewingSelf 
                          ? posts.filter(p => p.user.id === user.id).length 
                          : viewingUserPosts.length}
                      </span>
                      <span className="stat-label">貼文</span>
                    </div>
                  </div>
                </div>

                {/* 個人貼文牆 - IG 風格的網格顯示 */}
                <div className="profile-posts-section">
                  <div className="profile-posts-header">
                    <div 
                      className={`posts-tab ${profileTab === 'posts' ? 'active' : ''}`}
                      onClick={() => setProfileTab('posts')}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="13" y="3" width="7" height="7" />
                        <rect x="3" y="13" width="7" height="7" />
                        <rect x="13" y="13" width="7" height="7" />
                      </svg>
                      <span>貼文</span>
                    </div>
                    {/* 步驟2-2：查看他人時隱藏收藏和歷史標籤 */}
                    {isViewingSelf && (
                      <>
                        <div 
                          className={`posts-tab ${profileTab === 'favorites' ? 'active' : ''}`}
                          onClick={async () => {
                            setProfileTab('favorites');
                            if (favorites.length === 0) {
                              await loadFavorites();
                            }
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>⭐</span>
                          <span>收藏</span>
                        </div>
                        <div 
                          className={`posts-tab ${profileTab === 'history' ? 'active' : ''}`}
                          onClick={async () => {
                            setProfileTab('history');
                            if (viewHistory.length === 0) {
                              await loadViewHistory();
                            }
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>🕒</span>
                          <span>歷史</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {profileLoading ? (
                    <Loading text="載入中..." size="medium" />
                  ) : (
                    <div className="profile-posts-grid">
                      {profileTab === 'posts' && (() => {
                        // 步驟2：根據 isViewingSelf 決定顯示哪些貼文
                        const filteredPosts = isViewingSelf 
                          ? posts.filter(p => p.user.id === user.id)
                          : viewingUserPosts;
                        return filteredPosts.map((post, index) => (
                          <div 
                            key={post.id} 
                            className="profile-post-item"
                            onClick={() => {
                              setFullscreenPostsList(filteredPosts);
                              setFullscreenInitialIndex(index);
                              setShowFullscreenViewer(true);
                            }}
                          >
                            {post.media.length > 0 ? (
                              <img src={post.media[0].uri} alt="Post" />
                            ) : (
                              <div className="profile-post-content">
                                <p>{post.content}</p>
                              </div>
                            )}
                            <div className="profile-post-overlay">
                              <div className="overlay-stats">
                                <span>❤️ {post.likes}</span>
                                <span>💬 {post.comments}</span>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    
                    {/* 步驟2-2：只有查看自己時才顯示收藏和歷史 */}
                    {isViewingSelf && profileTab === 'favorites' && (() => {
                      const filteredFavorites = favorites.filter(f => f.post).map(f => f.post!);
                      return filteredFavorites.map((post, index) => {
                        const fav = favorites.find(f => f.post?.id === post.id)!;
                        return (
                          <div 
                            key={fav.id} 
                            className="profile-post-item"
                            onClick={() => {
                              setFullscreenPostsList(filteredFavorites);
                              setFullscreenInitialIndex(index);
                              setShowFullscreenViewer(true);
                            }}
                          >
                            {post.media.length > 0 ? (
                              <img src={post.media[0].uri} alt="Post" />
                            ) : (
                              <div className="profile-post-content">
                                <p>{post.content}</p>
                              </div>
                            )}
                            <div className="profile-post-overlay">
                              <div className="overlay-stats">
                                <span>❤️ {post.likes}</span>
                                <span>💬 {post.comments}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                    
                    {isViewingSelf && profileTab === 'history' && (() => {
                      const filteredHistory = viewHistory.filter(h => h.post).map(h => h.post!);
                      return filteredHistory.map((post, index) => {
                        const history = viewHistory.find(h => h.post?.id === post.id)!;
                        return (
                          <div 
                            key={history.id} 
                            className="profile-post-item"
                            onClick={() => {
                              setFullscreenPostsList(filteredHistory);
                              setFullscreenInitialIndex(index);
                              setShowFullscreenViewer(true);
                            }}
                          >
                            {post.media.length > 0 ? (
                              <img src={post.media[0].uri} alt="Post" />
                            ) : (
                              <div className="profile-post-content">
                                <p>{post.content}</p>
                              </div>
                            )}
                            <div className="profile-post-overlay">
                              <div className="overlay-stats">
                                <span>❤️ {post.likes}</span>
                                <span>💬 {post.comments}</span>
                              </div>
                            </div>
                            <button
                              className="delete-history-btn"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await FirebaseService.deleteViewHistory(history.id);
                                await loadViewHistory();
                              }}
                              title="刪除此記錄"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                              </svg>
                            </button>
                          </div>
                        );
                      });
                    })()}
                    </div>
                  )}
                  
                  {/* 步驟2：根據 isViewingSelf 更新空狀態訊息 */}
                  {!profileLoading && profileTab === 'posts' && (
                    isViewingSelf 
                      ? posts.filter(p => p.user.id === user.id).length === 0 
                      : viewingUserPosts.length === 0
                  ) && (
                    <div className="no-posts">
                      <p>{isViewingSelf ? '還沒有發布任何貼文' : '此用戶還沒有發布任何貼文'}</p>
                      {isViewingSelf && <p>📸 分享你的第一則貼文吧！</p>}
                    </div>
                  )}
                  
                  {isViewingSelf && !profileLoading && profileTab === 'favorites' && favorites.length === 0 && (
                    <div className="no-posts">
                      <p>還沒有收藏任何貼文</p>
                      <p>⭐ 點擊貼文上的星星來收藏吧！</p>
                    </div>
                  )}
                  
                  {isViewingSelf && !profileLoading && profileTab === 'history' && viewHistory.length === 0 && (
                    <div className="no-posts">
                      <p>還沒有瀏覽紀錄</p>
                      <p>🕒 開始探索精彩內容吧！</p>
                    </div>
                  )}
                </div>

                {/* 清空歷史記錄浮動按鈕 - 步驟2：只有查看自己時才顯示 */}
                {isViewingSelf && currentView === 'profile' && profileTab === 'history' && viewHistory.length > 0 && (
                  <button
                    className="clear-all-history-fab"
                    onClick={async () => {
                      if (window.confirm('確定要清除所有瀏覽歷史嗎？')) {
                        await FirebaseService.clearAllViewHistory(user.id);
                        await loadViewHistory();
                      }
                    }}
                    title="清空所有歷史"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {showCreatePost && (
        <div className="modal-overlay" onClick={() => setShowCreatePost(false)}>
          <div className="modal-content create-post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ 發布新貼文</h2>
              <button onClick={() => setShowCreatePost(false)} className="close-button">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <textarea
                className="post-textarea"
                placeholder="分享你的想法..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows={4}
              />
              
              <div className="post-actions">
                <label className="upload-button">
                  � 上傳圖片
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </label>
                
                <button
                  className="location-button"
                  onClick={handleGetLocation}
                >
                  {postLocation ? '✓ 已取得位置' : '📍 取得位置'}
                </button>
              </div>

              {postImagePreview && (
                <div className="image-preview">
                  <img src={postImagePreview} alt="預覽" />
                  <button
                    className="remove-image"
                    onClick={() => {
                      setPostImage(null);
                      setPostImagePreview(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {postLocation && (
                <div className="location-info">
                  📍 位置: {postLocation.latitude.toFixed(4)}, {postLocation.longitude.toFixed(4)}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                onClick={handleCreatePost}
                className="btn-primary"
                disabled={postSubmitting || !postContent.trim() || !postLocation}
              >
                {postSubmitting ? '發布中...' : '發布貼文'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯個人資料彈窗 */}
      {user && (
        <EditProfileModal
          user={user}
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={handleProfileUpdate}
        />
      )}

      {/* 全螢幕貼文查看器（新版）*/}
      {showFullscreenViewer && (
        <FullscreenPostViewer
          posts={fullscreenPostsList}
          currentIndex={fullscreenInitialIndex}
          isOpen={showFullscreenViewer}
          onClose={() => setShowFullscreenViewer(false)}
          onNavigate={(newIndex: number) => setFullscreenInitialIndex(newIndex)}
          onLike={handleLike}
          onFavorite={handleFavorite}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
}

// 路由包裝器 - 處理主應用和個人頁面路由
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 監聽認證狀態（提升到路由層級）
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      setIsAuthenticated(!!firebaseUser);
      if (firebaseUser) {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
        
        // 設置 Analytics 用戶
        if (userData) {
          AnalyticsService.setUser(firebaseUser.uid, {
            username: userData.username,
            displayName: userData.displayName,
          });
          AnalyticsService.trackSessionStart();
        }
      } else {
        setUser(null);
        AnalyticsService.clearUser();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/u/:username" element={
        // 如果是已登入用戶，顯示主應用（內部導航）
        isAuthenticated ? <MainApp /> : <ProfilePage currentUser={user} isAuthenticated={isAuthenticated} />
      } />
    </Routes>
  );
}

export default App;
