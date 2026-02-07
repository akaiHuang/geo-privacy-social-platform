import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FirebaseService from '../services/firebase';
import { Post, UserInfo } from '../types';

interface PublicProfilePageProps {
  currentUser: UserInfo | null;
  isAuthenticated: boolean;
  onLogin: () => void;
}

export const PublicProfilePage: React.FC<PublicProfilePageProps> = ({
  currentUser,
  isAuthenticated,
  onLogin,
}) => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState<UserInfo | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // 未登入用戶的瀏覽追蹤
  const [viewedPostsCount, setViewedPostsCount] = useState(0);
  const [promptDismissCount, setPromptDismissCount] = useState(0);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  // 設置 Intersection Observer 來追蹤貼文瀏覽
  useEffect(() => {
    if (isAuthenticated || posts.length === 0) return;

    // 清理舊的 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 創建新的 observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId) {
              handlePostView(postId);
            }
          }
        });
      },
      {
        threshold: 0.5, // 貼文 50% 可見時觸發
      }
    );

    // 觀察所有貼文
    postRefs.current.forEach((element) => {
      if (element && observerRef.current) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [posts, isAuthenticated]);

  const loadProfile = async () => {
    if (!username) return;
    
    setLoading(true);
    try {
      const user = await FirebaseService.getUserByUsername(username);
      if (!user) {
        setProfileUser(null);
        return;
      }
      setProfileUser(user);
      
      const userPosts = await FirebaseService.getUserPosts(user.id);
      setPosts(userPosts);
    } catch (error) {
      console.error('載入個人頁面失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostView = (postId: string) => {
    if (isAuthenticated) return;

    // 使用 sessionStorage 來記錄已瀏覽的貼文
    const viewedPosts = JSON.parse(sessionStorage.getItem('viewedPosts') || '[]');
    
    if (!viewedPosts.includes(postId)) {
      viewedPosts.push(postId);
      sessionStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
      
      const newCount = viewedPosts.length;
      setViewedPostsCount(newCount);

      // 每 3 篇顯示一次提示
      if (newCount > 0 && newCount % 3 === 0) {
        setShowLoginPrompt(true);
      }
    }
  };

  const handleClosePrompt = () => {
    setShowLoginPrompt(false);
    setPromptDismissCount(prev => prev + 1);
  };

  const setPostRef = (postId: string) => (element: HTMLDivElement | null) => {
    if (element) {
      postRefs.current.set(postId, element);
    } else {
      postRefs.current.delete(postId);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <header className="app-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← 返回
          </button>
          <h1>brobro</h1>
          <div style={{ width: '80px' }} />
        </header>
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
          載入中...
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="app-container">
        <header className="app-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← 返回
          </button>
          <h1>brobro</h1>
          <div style={{ width: '80px' }} />
        </header>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <h2 style={{ color: '#E5E7EB', marginBottom: '1rem' }}>用戶不存在</h2>
          <button 
            className="auth-button"
            onClick={() => navigate('/')}
            style={{ maxWidth: '200px' }}
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 頂部導航 */}
      <header className="app-header">
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          ← 返回
        </button>
        <h1>@{username}</h1>
        <div style={{ width: '80px' }} />
      </header>

      <div className="profile-container">
        {/* 個人資料頭部 */}
        <div className="profile-header">
          <div className="profile-avatar-large">
            {profileUser.avatar ? (
              <img src={profileUser.avatar} alt={profileUser.displayName} />
            ) : (
              profileUser.displayName?.charAt(0) || '?'
            )}
          </div>

          <div className="profile-info">
            <div className="profile-name-row">
              <h3>{profileUser.displayName}</h3>
              {profileUser.badge && (
                <span className="profile-badge">{profileUser.badge}</span>
              )}
            </div>
            <div className="profile-username">@{profileUser.username}</div>
            
            {/* 互動按鈕區 - 未登入不顯示編輯按鈕 */}
            {!isAuthenticated && (
              <button 
                className="auth-button"
                onClick={onLogin}
                style={{ marginTop: '1rem', maxWidth: '200px' }}
              >
                登入以互動
              </button>
            )}
            
            {isAuthenticated && !isOwnProfile && (
              <div style={{ marginTop: '1rem' }}>
                <button className="btn-small btn-primary">
                  + 加好友
                </button>
              </div>
            )}
            
            {isAuthenticated && isOwnProfile && (
              <button 
                className="edit-profile-btn"
                onClick={() => navigate('/')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                編輯個人資料
              </button>
            )}

            {profileUser.bio && (
              <p className="profile-bio">{profileUser.bio}</p>
            )}
          </div>
        </div>

        {/* 統計數據 */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-number">{posts.length}</span>
            <span className="stat-label">貼文</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">0</span>
            <span className="stat-label">粉絲</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">0</span>
            <span className="stat-label">追蹤中</span>
          </div>
        </div>

        {/* 貼文區域 */}
        <div className="profile-posts-section">
          <div className="profile-posts-header">
            <div className="posts-tab active">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              貼文 ({posts.length})
            </div>
          </div>

          <div className="profile-posts-grid">
            {posts.map((post) => (
              <div
                key={post.id}
                ref={setPostRef(post.id)}
                data-post-id={post.id}
                className="profile-post-item"
                onClick={() => {
                  console.log('文章被點擊:', post.id, '登入狀態:', isAuthenticated);
                  if (!isAuthenticated) {
                    console.log('顯示登入提示');
                    setShowLoginPrompt(true);
                    return;
                  }
                  console.log('已登入用戶點擊文章');
                  // TODO: 已登入用戶可以打開全螢幕檢視
                }}
              >
                {post.media && post.media.length > 0 ? (
                  <img src={post.media[0].uri} alt="" />
                ) : (
                  <div className="profile-post-content">
                    <p>{post.content}</p>
                  </div>
                )}
                {isAuthenticated && (
                  <div className="profile-post-overlay">
                    <div className="overlay-stats">
                      <span>❤️ {post.likes || 0}</span>
                      <span>💬 {post.comments || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="no-posts">
              <p>尚無貼文</p>
            </div>
          )}
        </div>
      </div>

      {/* 登入提示全螢幕 Modal */}
      {showLoginPrompt && !isAuthenticated && (
        <div 
          className="login-fullscreen-modal"
          onClick={handleClosePrompt}
        >
          <div 
            className="login-fullscreen-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="close-button-fullscreen"
              onClick={handleClosePrompt}
            >
              ×
            </button>
            
            <div className="login-prompt-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>

            <h2>登入以查看更多</h2>
            <p className="login-prompt-text">
              你已經瀏覽了 {viewedPostsCount} 篇貼文<br />
              登入後即可無限制瀏覽完整內容並與其他用戶互動
            </p>

            <div className="login-prompt-features">
              <div className="feature-item">
                <span className="feature-icon">❤️</span>
                <span>按讚與收藏</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <span>留言互動</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <span>加好友</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📍</span>
                <span>探索地圖</span>
              </div>
            </div>

            <button 
              className="auth-button"
              onClick={onLogin}
              style={{ width: '100%', maxWidth: '300px' }}
            >
              立即登入 / 註冊
            </button>

            <button 
              className="continue-browsing-btn"
              onClick={handleClosePrompt}
            >
              繼續瀏覽
            </button>

            {promptDismissCount > 0 && (
              <p className="dismiss-count-text">
                你已關閉 {promptDismissCount} 次提示
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
