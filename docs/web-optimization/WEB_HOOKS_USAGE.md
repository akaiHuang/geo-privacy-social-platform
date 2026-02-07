# 如何使用優化後的 Hooks

## 1. useAuth Hook

### 基本用法
```typescript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/auth" />;

  return <div>歡迎, {user?.displayName}</div>;
}
```

### 認證表單
```typescript
import { useAuthForm } from '../hooks/useAuth';

function AuthForm() {
  const { formState, updateField, resetForm } = useAuthForm();

  const handleSubmit = async () => {
    // 使用 formState.email, formState.password 等
    await AuthService.signIn(formState.email, formState.password);
    resetForm();
  };

  return (
    <input
      value={formState.email}
      onChange={(e) => updateField('email', e.target.value)}
    />
  );
}
```

---

## 2. usePosts Hook

### 基本用法
```typescript
import { usePosts } from '../hooks/usePosts';

function FeedPage() {
  const { posts, loading, toggleLike, toggleFavorite } = usePosts(user?.id);

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => toggleLike(post.id)}
          onFavorite={() => toggleFavorite(post.id)}
        />
      ))}
    </div>
  );
}
```

### 樂觀更新
Hook 自動處理樂觀更新，無需手動管理：
```typescript
// ✅ 自動樂觀更新，失敗時回滾
toggleLike(postId);

// ❌ 不需要手動管理狀態
// setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked } : p));
```

---

## 3. useNotifications Hook

### 基本用法
```typescript
import { useNotifications } from '../hooks/useNotifications';

function NotificationsPage() {
  const {
    notifications,
    friendRequests,
    unreadCount,
    markAsRead,
    acceptFriendRequest,
  } = useNotifications(user?.id);

  return (
    <div>
      <h2>通知 ({unreadCount})</h2>
      {notifications.map(notif => (
        <Notification
          key={notif.id}
          data={notif}
          onRead={() => markAsRead(notif.id)}
        />
      ))}
    </div>
  );
}
```

---

## 4. useComments Hook

### 基本用法
```typescript
import { useComments } from '../hooks/useComments';

function PostCard({ post }) {
  const {
    commentState,
    toggleComments,
    updateCommentText,
    submitComment,
  } = useComments();

  const state = commentState[post.id] || {};

  return (
    <div>
      <button onClick={() => toggleComments(post.id)}>
        評論 ({post.comments})
      </button>
      
      {state.visible && (
        <div>
          {state.comments?.map(comment => (
            <Comment key={comment.id} data={comment} />
          ))}
          
          <input
            value={state.text || ''}
            onChange={(e) => updateCommentText(post.id, e.target.value)}
          />
          <button onClick={() => submitComment(post.id)}>
            發送
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 5. 組合多個 Hooks

```typescript
function MainApp() {
  const { user } = useAuth();
  const { posts, toggleLike } = usePosts(user?.id);
  const { notifications, unreadCount } = useNotifications(user?.id);
  const commentHooks = useComments();

  return (
    <div>
      <Header unreadCount={unreadCount} />
      <Feed
        posts={posts}
        onLike={toggleLike}
        commentHooks={commentHooks}
      />
    </div>
  );
}
```

---

## 性能優化技巧

### 1. 使用 React.memo
```typescript
import { memo } from 'react';

export const PostCard = memo(({ post, onLike }) => {
  // 只在 post 或 onLike 改變時重新渲染
  return <div>...</div>;
});
```

### 2. 使用 useCallback
```typescript
const handleLike = useCallback((postId: string) => {
  toggleLike(postId);
}, [toggleLike]);
```

### 3. 使用 useMemo
```typescript
const sortedPosts = useMemo(() => {
  return posts.sort((a, b) => b.createdAt - a.createdAt);
}, [posts]);
```

---

## 常見問題

### Q: 如何避免重複請求？
A: Hooks 內部已實現去重，使用 `useCallback` 確保函數引用穩定。

### Q: 如何處理錯誤？
A: Hooks 會自動 console.error，可以添加全局錯誤處理：
```typescript
try {
  await toggleLike(postId);
} catch (error) {
  showToast('操作失敗');
}
```

### Q: 如何測試這些 Hooks？
A: 使用 `@testing-library/react-hooks`:
```typescript
import { renderHook } from '@testing-library/react-hooks';
import { usePosts } from '../hooks/usePosts';

test('should toggle like', async () => {
  const { result } = renderHook(() => usePosts('user-id'));
  await result.current.toggleLike('post-id');
  expect(result.current.posts[0].isLiked).toBe(true);
});
```
