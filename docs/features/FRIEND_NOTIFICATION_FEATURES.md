# 好友系統與通知功能說明

## 已完成功能

### 1. 地圖標記圖片置中 ✅
- 修正地圖上標記的圖片位置
- 使用 CSS flexbox 實現完美置中
- 圖片滿版顯示且保持比例

### 2. Instagram 風格時間顯示 ✅
- 顯示相對時間：剛剛、X 分鐘前、X 小時前、X 天前
- 超過一週：X 週前
- 超過一個月：X 個月前
- 超過一年：X 年前
- 與 Instagram 顯示方式一致

### 3. 一人一讚限制 ✅
- 後端驗證機制，防止重複按讚
- 用戶再次點讚時會顯示提示訊息
- 使用 Firestore `likes` 集合記錄按讚狀態

### 4. 好友系統 ✅

#### 4.1 發送好友請求
- 在每篇貼文的用戶名稱旁有「➕ 加好友」按鈕
- 不能對自己發送好友請求
- 點擊後立即發送好友請求並通知對方

#### 4.2 好友狀態顯示
系統會即時顯示與其他用戶的關係狀態：
- `none`: 顯示「➕ 加好友」和「🚫 封鎖」按鈕
- `pending_sent`: 顯示「已發送請求」
- `pending_received`: 顯示「對方已發送請求」
- `friends`: 顯示「✓ 好友」
- `blocked`: 顯示「已封鎖」

#### 4.3 接受/拒絕好友請求
- 在通知頁面可以看到所有待處理的好友請求
- 每個請求有「接受」和「拒絕」按鈕
- 接受後雙方成為好友並互相通知

#### 4.4 封鎖功能
- 每個用戶旁都有「🚫 封鎖」按鈕
- 封鎖後會自動移除好友關係
- 被封鎖的用戶看不到你的新貼文（需要配合前端篩選實現）

### 5. 通知系統 ✅

#### 5.1 通知類型
- **好友請求** (`friend_request`): 有人向你發送好友請求
- **接受好友** (`friend_accepted`): 有人接受了你的好友請求
- **貼文按讚** (`post_liked`): 有人按讚你的貼文
- **貼文評論** (`post_commented`): 有人評論你的貼文

#### 5.2 通知頁面
- 點擊 header 的「🔔 通知」按鈕進入通知頁面
- 未讀通知數量會顯示在通知按鈕上（紅色徽章）
- 通知分為兩個區域：
  - **好友請求**: 顯示所有待處理的好友請求
  - **所有通知**: 顯示所有通知，未讀通知會高亮顯示

#### 5.3 即時更新
- 使用 Firestore `onSnapshot` 實現即時通知
- 新通知會立即出現，無需重新整理頁面
- 未讀數量會即時更新

#### 5.4 已讀標記
- 點擊未讀通知會自動標記為已讀
- 「全部標為已讀」按鈕可一次性標記所有通知為已讀
- 已讀通知會變暗顯示

## Firestore 資料結構

### friend_requests 集合
```typescript
{
  fromUserId: string,
  fromUser: UserInfo,
  toUserId: string,
  toUser: UserInfo,
  status: 'pending' | 'accepted' | 'rejected',
  createdAt: Timestamp
}
```

### friendships 集合
```typescript
{
  userId1: string,
  userId2: string,
  createdAt: Timestamp
}
```

### blocks 集合
```typescript
{
  blockerId: string,
  blockedId: string,
  createdAt: Timestamp
}
```

### notifications 集合
```typescript
{
  userId: string,
  type: 'friend_request' | 'friend_accepted' | 'post_liked' | 'post_commented',
  fromUserId: string,
  fromUser: UserInfo,
  postId?: string,
  commentId?: string,
  read: boolean,
  createdAt: Timestamp
}
```

### likes 集合
```typescript
{
  userId: string,
  postId: string,
  createdAt: Timestamp
}
```

## 使用方式

1. **查看通知**: 點擊 header 的「🔔 通知」按鈕
2. **加好友**: 在動態牆的任何貼文右上角點擊「➕ 加好友」
3. **處理好友請求**: 進入通知頁面，在好友請求區域點擊「接受」或「拒絕」
4. **封鎖用戶**: 在貼文右上角點擊「🚫 封鎖」按鈕
5. **查看好友狀態**: 好友狀態會自動顯示在每個貼文的用戶名稱旁

## 技術實現

### 後端 (FirebaseService)
- `getFriendshipStatus()`: 檢查與指定用戶的好友關係
- `sendFriendRequest()`: 發送好友請求
- `acceptFriendRequest()`: 接受好友請求
- `rejectFriendRequest()`: 拒絕好友請求
- `removeFriend()`: 刪除好友
- `blockUser()`: 封鎖用戶
- `unblockUser()`: 解除封鎖
- `getPendingFriendRequests()`: 獲取待處理的好友請求
- `createNotification()`: 創建通知
- `getNotifications()`: 獲取通知列表
- `markNotificationAsRead()`: 標記通知為已讀
- `markAllNotificationsAsRead()`: 標記所有通知為已讀
- `subscribeToNotifications()`: 訂閱即時通知

### 前端 (App.tsx)
- 使用 React hooks 管理通知和好友狀態
- 即時監聽通知更新
- 在貼文卡片上動態顯示好友按鈕
- 通知頁面展示好友請求和所有通知

### 索引優化
已在 `firestore.indexes.json` 中配置以下複合索引：
- `friend_requests`: toUserId + status + createdAt
- `notifications`: userId + createdAt
- `notifications`: userId + read

## 部署狀態

✅ 所有功能已部署到: https://brobro-fd803.web.app
✅ Firestore 索引已配置並部署
✅ 前端和後端代碼已更新並測試

## 下一步建議

1. **好友列表頁面**: 添加專門的好友列表頁面，顯示所有好友
2. **只對好友顯示**: 可選設定，讓貼文只對好友可見
3. **好友動態**: 僅顯示好友的貼文
4. **通知設定**: 允許用戶關閉某些類型的通知
5. **聊天功能**: 在好友之間添加私訊功能
