# FullscreenPostViewer 使用指南

獨立的全螢幕貼文查看器組件，可在任何地方重複使用。

## 功能特性

- ✅ 全螢幕顯示貼文（圖片、內容、用戶信息）
- ✅ 滑動/滾輪/鍵盤導航（上下切換貼文）
- ✅ 留言功能（新增留言、回覆留言）
- ✅ 按讚和收藏功能
- ✅ 自動記錄瀏覽歷史（可選）
- ✅ 16:10 直式比例 + 12px 圓角設計

## 安裝使用

### 1. 引入組件

```tsx
import { FullscreenPostViewer } from './components/FullscreenPostViewer';
```

### 2. 準備狀態

```tsx
const [showViewer, setShowViewer] = useState(false);
const [selectedIndex, setSelectedIndex] = useState(0);
const [posts, setPosts] = useState<Post[]>([]);
```

### 3. 使用組件

```tsx
<FullscreenPostViewer
  posts={posts}                    // 要顯示的貼文列表
  initialIndex={selectedIndex}      // 初始顯示的貼文索引
  isOpen={showViewer}              // 是否顯示
  onClose={() => setShowViewer(false)}  // 關閉回調
  onLike={handleLike}              // 按讚處理函數
  onFavorite={handleFavorite}      // 收藏處理函數
  onPostsUpdate={loadPosts}        // 貼文更新後的回調
  onViewHistory={recordViewHistory} // (可選) 記錄瀏覽歷史
/>
```

## 完整範例

### 基本用法

```tsx
import { useState } from 'react';
import { FullscreenPostViewer } from './components/FullscreenPostViewer';
import FirebaseService from './services/firebase';
import { Post } from './types';

function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 載入貼文
  const loadPosts = async () => {
    const fetchedPosts = await FirebaseService.getPosts();
    setPosts(fetchedPosts);
  };

  // 打開全螢幕查看器
  const openPost = (index: number) => {
    setSelectedIndex(index);
    setShowViewer(true);
  };

  // 按讚處理
  const handleLike = async (postId: string) => {
    await FirebaseService.toggleLike(postId);
    await loadPosts(); // 重新載入更新後的資料
  };

  // 收藏處理
  const handleFavorite = async (postId: string) => {
    await FirebaseService.toggleFavorite(postId);
    await loadPosts();
  };

  // 記錄瀏覽歷史（可選）
  const recordViewHistory = async (postId: string) => {
    await FirebaseService.addViewHistory(postId);
  };

  return (
    <div>
      {/* 貼文網格 */}
      <div className="posts-grid">
        {posts.map((post, index) => (
          <div 
            key={post.id}
            onClick={() => openPost(index)}
            className="post-card"
          >
            {post.media[0] && <img src={post.media[0].uri} alt="Post" />}
          </div>
        ))}
      </div>

      {/* 全螢幕查看器 */}
      <FullscreenPostViewer
        posts={posts}
        initialIndex={selectedIndex}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        onLike={handleLike}
        onFavorite={handleFavorite}
        onPostsUpdate={loadPosts}
        onViewHistory={recordViewHistory}
      />
    </div>
  );
}
```

### 在個人頁面使用

```tsx
function ProfilePage({ userId }: { userId: string }) {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 載入特定用戶的貼文
  const loadUserPosts = async () => {
    const posts = await FirebaseService.getPostsByUserId(userId);
    setUserPosts(posts);
  };

  return (
    <div>
      <div className="profile-posts-grid">
        {userPosts.map((post, index) => (
          <div 
            key={post.id}
            onClick={() => {
              setSelectedIndex(index);
              setShowViewer(true);
            }}
          >
            <img src={post.media[0]?.uri} alt="Post" />
          </div>
        ))}
      </div>

      <FullscreenPostViewer
        posts={userPosts}
        initialIndex={selectedIndex}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        onLike={handleLike}
        onFavorite={handleFavorite}
        onPostsUpdate={loadUserPosts}
      />
    </div>
  );
}
```

### 在地圖上使用

```tsx
function MapView() {
  const [mapPosts, setMapPosts] = useState<Post[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string>('');

  // 點擊地圖標記
  const handleMarkerClick = (postId: string) => {
    const index = mapPosts.findIndex(p => p.id === postId);
    if (index !== -1) {
      setSelectedPostId(postId);
      setShowViewer(true);
    }
  };

  const selectedIndex = mapPosts.findIndex(p => p.id === selectedPostId);

  return (
    <div>
      <MapboxView
        posts={mapPosts}
        onMarkerClick={handleMarkerClick}
      />

      <FullscreenPostViewer
        posts={mapPosts}
        initialIndex={selectedIndex}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        onLike={handleLike}
        onFavorite={handleFavorite}
        onPostsUpdate={loadMapPosts}
        onViewHistory={recordViewHistory}
      />
    </div>
  );
}
```

## Props 說明

| Prop | 類型 | 必填 | 說明 |
|------|------|------|------|
| `posts` | `Post[]` | ✅ | 要顯示的貼文陣列 |
| `initialIndex` | `number` | ✅ | 初始顯示的貼文索引 (0-based) |
| `isOpen` | `boolean` | ✅ | 是否顯示查看器 |
| `onClose` | `() => void` | ✅ | 關閉查看器的回調函數 |
| `onLike` | `(postId: string) => Promise<void>` | ✅ | 按讚/取消按讚的處理函數 |
| `onFavorite` | `(postId: string) => Promise<void>` | ✅ | 收藏/取消收藏的處理函數 |
| `onPostsUpdate` | `() => Promise<void>` | ✅ | 貼文資料更新後的回調（如新增留言後） |
| `onViewHistory` | `(postId: string) => Promise<void>` | ❌ | (可選) 記錄瀏覽歷史的函數 |

## 操作方式

### 鍵盤操作
- **↑ / ←**: 上一篇貼文
- **↓ / →**: 下一篇貼文
- **Esc**: 關閉查看器

### 滑鼠操作
- **滾輪向上**: 上一篇貼文
- **滾輪向下**: 下一篇貼文
- **點擊背景**: 關閉查看器

### 觸控操作
- **向下滑動**: 上一篇貼文
- **向上滑動**: 下一篇貼文

## 注意事項

1. **用戶資料獲取**: 組件會使用 `post.user` 的資料，確保每個 Post 物件包含完整的用戶信息：
   ```typescript
   interface Post {
     id: string;
     content: string;
     media: MediaItem[];
     location: Location;
     createdAt: string;
     likes: number;
     comments: number;
     isLiked: boolean;
     isFavorited: boolean;
     user: {
       id: string;
       username: string;
       displayName: string;
       avatar?: string;
     };
   }
   ```

2. **Firebase 方法**: 確保 FirebaseService 包含以下方法：
   - `getComments(postId: string)`
   - `addComment(postId: string, content: string, parentCommentId?: string)`
   - `toggleLike(postId: string)` 或 `likePost/unlikePost`
   - `toggleFavorite(postId: string)` 或 `favoritePost/unfavoritePost`
   - `addViewHistory(postId: string)` (可選)

3. **CSS 引入**: 組件會自動引入 `FullscreenPostViewer.css`，無需額外引入。

4. **效能優化**: 
   - 使用 `React.memo` 包裝組件可提升效能
   - 大量貼文時考慮分頁或虛擬滾動

## 樣式自訂

如需自訂樣式，可以在 `FullscreenPostViewer.css` 中修改以下變數：

```css
/* 主要顏色 */
--primary-color: #A78BFA;
--primary-hover: #8B5CF6;

/* 背景顏色 */
--bg-overlay: rgba(10, 10, 15, 0.3);
--bg-card: rgba(26, 26, 36, 0.95);

/* 圓角大小 */
--border-radius: 24px;

/* 動畫速度 */
--animation-duration: 0.4s;
```
