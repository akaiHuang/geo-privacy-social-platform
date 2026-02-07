import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import FirebaseService from '../services/firebase';
import { UserInfo, Post, Favorite, ViewHistory } from '../types';
import { linkify } from '../utils/profileHelpers';
import { FullscreenPostViewer } from './FullscreenPostViewer';
import './ProfilePage.css';

interface ProfilePageProps {
  currentUser: UserInfo | null;
  isAuthenticated: boolean;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser, isAuthenticated }) => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [profileUser, setProfileUser] = useState<UserInfo | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [viewHistory, setViewHistory] = useState<ViewHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'map' | 'mapB' | 'favorites' | 'history'>('posts');
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [fullscreenPost, setFullscreenPost] = useState<{ posts: Post[], index: number } | null>(null);
  const clickCountRef = useRef(0);

  const isOwnProfile = currentUser?.username === username;
  
  // 判斷是否從內部導航來的（有 state 或 referrer）
  const isFromInternalNav = location.state?.fromInternal || document.referrer.includes(window.location.origin);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    if (!username) return;

    try {
      setLoading(true);
      
      console.log('🔍 載入個人頁面，username:', username);
      
      // 載入目標用戶資料
      const user = await FirebaseService.getUserByUsername(username);
      console.log('👤 找到用戶:', user);
      
      if (!user) {
        alert('用戶不存在');
        navigate('/');
        return;
      }
      setProfileUser(user);

      // 載入貼文
      console.log('📝 開始載入貼文，userId:', user.id);
      const userPosts = await FirebaseService.getUserPosts(user.id);
      console.log('📦 載入到的貼文:', userPosts);
      setPosts(userPosts);

      // 如果已登入且是自己的頁面，載入收藏和歷史
      if (isAuthenticated && isOwnProfile && currentUser) {
        const [userFavorites, userHistory] = await Promise.all([
          FirebaseService.getFavorites(currentUser.id),
          FirebaseService.getViewHistory(currentUser.id)
        ]);
        setFavorites(userFavorites);
        setViewHistory(userHistory);
      }

      // 如果已登入且不是自己，檢查好友狀態
      if (isAuthenticated && !isOwnProfile && currentUser) {
        const status = await FirebaseService.getFriendshipStatus(user.id);
        setFriendStatus(status);
      }
    } catch (error) {
      console.error('❌ 載入個人頁面失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!isAuthenticated || !currentUser || !profileUser) {
      setShowLoginPrompt(true);
      return;
    }

    try {
      await FirebaseService.sendFriendRequest(profileUser.id);
      setFriendStatus('pending');
      alert('好友邀請已發送');
    } catch (error) {
      console.error('發送好友邀請失敗:', error);
      alert('發送失敗，請重試');
    }
  };

  const handleInteraction = () => {
    if (!isAuthenticated) {
      // 訪客模式：記錄點擊次數
      clickCountRef.current += 1;
      
      console.log('🔢 訪客點擊次數:', clickCountRef.current);
      
      // 每點擊 5 次彈出登入提示
      if (clickCountRef.current % 5 === 0) {
        setShowLoginPrompt(true);
      }
    }
  };

  const handleToggleFavorite = async (postId: string) => {
    if (!currentUser) return;

    try {
      await FirebaseService.toggleFavorite(postId);

      // 更新本地狀態
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, isFavorited: !p.isFavorited } : p
      ));

      // 如果在收藏分頁，重新載入收藏列表
      if (activeTab === 'favorites') {
        const userFavorites = await FirebaseService.getFavorites(currentUser.id);
        setFavorites(userFavorites);
      }
    } catch (error) {
      console.error('切換收藏失敗:', error);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!currentUser) return;

    try {
      await FirebaseService.toggleLike(postId);

      // 更新本地狀態
      setPosts(posts.map(p => 
        p.id === postId ? { 
          ...p, 
          isLiked: !p.isLiked,
          likes: p.isLiked ? (p.likes || 1) - 1 : (p.likes || 0) + 1
        } : p
      ));

      // 重新載入收藏和歷史列表以更新按讚狀態
      if (activeTab === 'favorites' && currentUser) {
        const userFavorites = await FirebaseService.getFavorites(currentUser.id);
        setFavorites(userFavorites);
      } else if (activeTab === 'history' && currentUser) {
        const userHistory = await FirebaseService.getViewHistory(currentUser.id);
        setViewHistory(userHistory);
      }
    } catch (error) {
      console.error('切換按讚失敗:', error);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!profileUser) {
    return <div className="profile-page-error">用戶不存在</div>;
  }

  return (
    <div className="profile-page">
      {/* 導航列 */}
      <header className="profile-header">
        {/* 只有從內部導航來且已登入才顯示返回按鈕 */}
        {isAuthenticated && isFromInternalNav && (
          <button className="back-btn" onClick={() => navigate('/')}>
            ← 返回
          </button>
        )}
        {(!isAuthenticated || !isFromInternalNav) && <div className="spacer"></div>}
        <h1>@{profileUser.username}</h1>
        {isAuthenticated && currentUser && (
          <button className="home-btn" onClick={() => navigate('/')}>
            首頁
          </button>
        )}
        {!isAuthenticated && <div className="spacer"></div>}
      </header>

      {/* 個人資訊卡片 */}
      <div className="profile-info-card">
        <div className="profile-avatar">
          {profileUser.avatar ? (
            <img src={profileUser.avatar} alt={profileUser.displayName} />
          ) : (
            <div className="avatar-placeholder">
              {profileUser.displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
        </div>

        <div className="profile-details">
          <div className="profile-name-row">
            <h2>{profileUser.displayName}</h2>
            {profileUser.badge && (
              <span className="profile-badge">🏆 {profileUser.badge}</span>
            )}
          </div>

          {profileUser.bio && (
            <p 
              className="profile-bio"
              dangerouslySetInnerHTML={{ __html: linkify(profileUser.bio) }}
            />
          )}

          {/* 附加資訊 */}
          <div className="profile-meta">
            {profileUser.website && (
              <div className="meta-item">
                🔗 <a href={profileUser.website} target="_blank" rel="noopener noreferrer">
                  {profileUser.website.replace(/https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>

          {/* 好友/互動按鈕 */}
          {!isOwnProfile && (
            <div className="profile-actions">
              {!isAuthenticated ? (
                <button className="login-prompt-btn" onClick={() => setShowLoginPrompt(true)}>
                  登入以互動
                </button>
              ) : friendStatus === 'none' ? (
                <button className="add-friend-btn" onClick={handleSendFriendRequest}>
                  + 加好友
                </button>
              ) : friendStatus === 'pending' ? (
                <button className="pending-btn" disabled>
                  已發送邀請
                </button>
              ) : friendStatus === 'friends' ? (
                <button className="friends-btn" disabled>
                  ✓ 已是好友
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Tab 切換 */}
      <div className="profile-tabs">
        <button
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          貼文 ({posts.length})
        </button>
        {/* 步驟3修正：訪客模式不顯示地圖標籤 */}
        {isAuthenticated && (
          <>
            <button
              className={activeTab === 'map' ? 'active' : ''}
              onClick={() => {
                setActiveTab('map');
                handleInteraction();
              }}
            >
              🗺️ 地圖A
            </button>
            <button
              className={activeTab === 'mapB' ? 'active' : ''}
              onClick={() => {
                setActiveTab('mapB');
                handleInteraction();
              }}
            >
              🗺️ 地圖B
            </button>
          </>
        )}
        {/* 只有已登入且是自己的頁面才顯示收藏和歷史 */}
        {isOwnProfile && isAuthenticated && (
          <>
            <button
              className={activeTab === 'favorites' ? 'active' : ''}
              onClick={() => setActiveTab('favorites')}
            >
              收藏 ({favorites.length})
            </button>
            <button
              className={activeTab === 'history' ? 'active' : ''}
              onClick={() => setActiveTab('history')}
            >
              歷史 ({viewHistory.length})
            </button>
          </>
        )}
      </div>

      {/* 內容區域 */}
      <div className="profile-content">
        {activeTab === 'posts' && (
          <div className="posts-grid">
            {posts.length === 0 ? (
              <div className="empty-state">尚無貼文</div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="post-thumbnail"
                  onClick={() => {
                    // 步驟3修正：訪客點擊貼文顯示簡潔登入彈窗
                    if (!isAuthenticated) {
                      setShowLoginPrompt(true);
                    } else {
                      // TODO: 開啟貼文詳情
                      console.log('Open post', post.id);
                    }
                  }}
                >
                  {post.media && post.media.length > 0 ? (
                    <img src={post.media[0].uri} alt="" />
                  ) : (
                    <div className="post-content">
                      <p>{post.content}</p>
                    </div>
                  )}
                  <div className="post-overlay">
                    <span>❤️ {post.likes || 0}</span>
                    <span>💬 {post.comments || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="map-view-placeholder">
            <div className="coming-soon">
              🗺️ 地圖 A 視圖
              <p>即將推出：查看此用戶的貼文地圖分布</p>
              {!isAuthenticated && (
                <button className="login-cta" onClick={() => setShowLoginPrompt(true)}>
                  登入查看完整功能
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mapB' && (
          <div className="map-view-placeholder">
            <div className="coming-soon">
              🗺️ 地圖 B 視圖
              <p>即將推出：互動式地圖瀏覽體驗</p>
              {!isAuthenticated && (
                <button className="login-cta" onClick={() => setShowLoginPrompt(true)}>
                  登入查看完整功能
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'favorites' && isOwnProfile && (
          <div className="posts-grid">
            {favorites.length === 0 ? (
              <div className="empty-state">尚無收藏</div>
            ) : (
              favorites.map((fav, index) => (
                <div
                  key={fav.postId}
                  className="post-thumbnail favorited"
                  onClick={() => {
                    if (fav.post) {
                      // 將所有收藏的貼文轉換為 Post[] 並標記為已收藏
                      const favoritePosts = favorites
                        .filter(f => f.post)
                        .map(f => {
                          const post = f.post!;
                          return {
                            ...post,
                            isFavorited: true
                          } as Post;
                        });
                      
                      setFullscreenPost({ posts: favoritePosts, index });
                    }
                  }}
                >
                  {fav.post?.media && fav.post.media.length > 0 ? (
                    <img src={fav.post.media[0].uri} alt="" />
                  ) : (
                    <div className="post-content">
                      <p>{fav.post?.content}</p>
                    </div>
                  )}
                  <div className="post-overlay">
                    <span>❤️ {fav.post?.likes || 0}</span>
                    <span>💬 {fav.post?.comments || 0}</span>
                  </div>
                  <div className="favorite-badge">⭐</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'history' && isOwnProfile && (
          <div className="posts-grid">
            {viewHistory.length === 0 ? (
              <div className="empty-state">尚無瀏覽歷史</div>
            ) : (
              viewHistory.map((history, index) => (
                <div
                  key={history.postId}
                  className="post-thumbnail"
                  onClick={() => {
                    if (history.post) {
                      // 將所有歷史貼文轉換為 Post[] 並保留其收藏狀態
                      const historyPosts = viewHistory
                        .filter(h => h.post)
                        .map(h => {
                          const post = h.post!;
                          return {
                            ...post,
                            isFavorited: post.isFavorited || false,
                            isLiked: post.isLiked || false,
                          } as Post;
                        });
                      setFullscreenPost({ posts: historyPosts, index });
                    }
                  }}
                >
                  {history.post?.media && history.post.media.length > 0 ? (
                    <img src={history.post.media[0].uri} alt="" />
                  ) : (
                    <div className="post-content">
                      <p>{history.post?.content}</p>
                    </div>
                  )}
                  <div className="post-overlay">
                    <span>❤️ {history.post?.likes || 0}</span>
                    <span>💬 {history.post?.comments || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 登入提示彈窗 */}
      {showLoginPrompt && (
        <div className="login-prompt-modal" onClick={() => setShowLoginPrompt(false)}>
          <div className="login-prompt-content" onClick={(e) => e.stopPropagation()}>
            <h3>需要登入</h3>
            <p>登入後即可查看完整內容並與其他用戶互動</p>
            <div className="prompt-actions">
              <button onClick={() => setShowLoginPrompt(false)}>
                取消
              </button>
              <button
                className="primary"
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate('/?auth=login');
                }}
              >
                立即登入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全螢幕貼文檢視器 */}
      {fullscreenPost && (
        <FullscreenPostViewer
          posts={fullscreenPost.posts}
          currentIndex={fullscreenPost.index}
          isOpen={true}
          onClose={() => setFullscreenPost(null)}
          onNavigate={(newIndex) => setFullscreenPost({ ...fullscreenPost, index: newIndex })}
          onLike={handleToggleLike}
          onFavorite={handleToggleFavorite}
          onCommentAdded={async (postId) => {
            // TODO: 實現留言功能
            console.log('Comment added', postId);
          }}
        />
      )}
    </div>
  );
};
