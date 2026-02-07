# 安全性措施文檔

## 概述
本文檔記錄了 BroBro 應用程式中實施的安全性措施，確保用戶隱私和資料安全。

## 多層安全防護

### 1. Firestore 安全規則（後端保護）

#### 🔒 安全規則改進重點

**貼文集合 (posts)**
- ✅ 創建時無需驗證（允許登入用戶發文）
- ✅ **更新：只能更新自己的貼文，且不能更改 userId**
- ✅ 刪除：只能刪除自己的貼文

```javascript
match /posts/{postId} {
  allow read: if true; // 公開可讀
  allow create: if request.auth != null;
  // 🔐 加強：防止用戶修改他人貼文或更改 userId
  allow update: if request.auth != null && 
    request.auth.uid == resource.data.userId &&
    request.resource.data.userId == resource.data.userId;
  allow delete: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}
```

**評論集合 (comments)**
- ✅ **創建：必須確保 userId 是創建者本人**
- ✅ **更新：只能更新自己的評論，且不能更改 userId**
- ✅ 刪除：只能刪除自己的評論

```javascript
match /comments/{commentId} {
  allow read: if true;
  // 🔐 加強：防止用戶冒充他人發評論
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null && 
    request.auth.uid == resource.data.userId &&
    request.resource.data.userId == resource.data.userId;
  allow delete: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}
```

**讚集合 (likes)**
- ✅ **創建：必須驗證 userId 是自己**
- ✅ **刪除：只能刪除自己的讚**
- ✅ **不允許更新讚記錄**

```javascript
match /likes/{likeId} {
  allow read: if true;
  // 🔐 加強：防止用戶冒充他人按讚
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
  allow delete: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  // 不允許更新
}
```

**好友關係集合 (friendships)**
- ✅ **創建：必須是兩個用戶之一**
- ✅ 讀取：只能讀取與自己相關的
- ✅ 刪除：只能刪除與自己相關的

```javascript
match /friendships/{friendshipId} {
  allow read: if request.auth != null && 
    (resource.data.userId1 == request.auth.uid || 
     resource.data.userId2 == request.auth.uid);
  // 🔐 加強：防止隨意創建好友關係
  allow create: if request.auth != null && 
    (request.resource.data.userId1 == request.auth.uid || 
     request.resource.data.userId2 == request.auth.uid);
  allow delete: if request.auth != null && 
    (resource.data.userId1 == request.auth.uid || 
     resource.data.userId2 == request.auth.uid);
}
```

**通知集合 (notifications)**
- ✅ **創建：必須是發送者本人或給自己創建**
- ✅ 讀取：只能讀取發給自己的
- ✅ 更新/刪除：只能操作自己的

```javascript
match /notifications/{notificationId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  // 🔐 加強：防止用戶發送假通知
  allow create: if request.auth != null && 
    (request.resource.data.fromUserId == request.auth.uid || 
     request.resource.data.userId == request.auth.uid);
  allow update: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow delete: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}
```

**用戶資料集合 (users)**
- ✅ **創建：只能創建自己的文檔**
- ✅ **更新：防止修改 createdAt 等敏感欄位**
- ✅ 刪除：只能刪除自己的

```javascript
match /users/{userId} {
  allow read: if true; // 基本資料公開
  allow create: if request.auth != null && 
    request.auth.uid == userId;
  // 🔐 加強：防止修改不可變欄位
  allow update: if request.auth != null && 
    request.auth.uid == userId &&
    (!request.resource.data.keys().hasAny(['createdAt']) || 
     request.resource.data.createdAt == resource.data.createdAt);
  allow delete: if request.auth != null && 
    request.auth.uid == userId;
}
```

#### 私密資料集合（只能訪問自己的）

**收藏集合 (favorites)**
```javascript
match /favorites/{favoriteId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
  allow delete: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}
```

**歷史記錄集合 (view_history)**
```javascript
match /view_history/{historyId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow delete: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}
```

**通知集合 (notifications)**
```javascript
match /notifications/{notificationId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow create: if request.auth != null;
  allow update: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow delete: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}
```

#### 公開資料集合

**貼文集合 (posts)**
```javascript
match /posts/{postId} {
  allow read: if true; // 公開可讀
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}
```

**用戶基本資料 (users)**
```javascript
match /users/{userId} {
  allow read: if true; // 基本資料公開可讀
  allow write: if request.auth != null && 
    request.auth.uid == userId; // 只能修改自己的
}
```

### 2. 服務層安全檢查（中間層保護）

**FirebaseService.getFavorites()**
```typescript
async getFavorites(userId: string): Promise<any[]> {
  // 安全性檢查：只能查詢自己的收藏
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId || currentUserId !== userId) {
    console.warn('安全性警告：嘗試查詢他人的收藏資料');
    return [];
  }
  // ... 查詢邏輯
}
```

**FirebaseService.getViewHistory()**
```typescript
async getViewHistory(userId: string): Promise<any[]> {
  // 安全性檢查：只能查詢自己的歷史記錄
  const currentUserId = auth.currentUser?.uid;
  if (!currentUserId || currentUserId !== userId) {
    console.warn('安全性警告：嘗試查詢他人的歷史記錄');
    return [];
  }
  // ... 查詢邏輯
}
```

**FirebaseService.getNotifications()**
```typescript
async getNotifications(limitCount: number = 50): Promise<Notification[]> {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];
  // 自動使用當前用戶 ID，無法查詢他人通知
  // ... 查詢邏輯
}
```

### 3. UI 層安全檢查（前端保護）

**App.tsx - loadFavorites()**
```typescript
const loadFavorites = async () => {
  if (!user) return;
  // 安全性檢查：只能載入自己的收藏
  if (!isViewingSelf) {
    console.warn('安全性警告：嘗試載入他人的收藏資料');
    return;
  }
  // ... 載入邏輯
};
```

**App.tsx - loadViewHistory()**
```typescript
const loadViewHistory = async () => {
  if (!user) return;
  // 安全性檢查：只能載入自己的歷史記錄
  if (!isViewingSelf) {
    console.warn('安全性警告：嘗試載入他人的歷史記錄');
    return;
  }
  // ... 載入邏輯
};
```

**URL 切換時重置私密資料**
```typescript
// 查看其他用戶時
setIsViewingSelf(false);
setProfileTab('posts'); // 強制重置為貼文標籤
// 防止殘留在收藏或歷史標籤
```

**UI 元素隱藏**
```tsx
{/* 步驟2-2：查看他人時隱藏收藏和歷史標籤 */}
{isViewingSelf && (
  <>
    <div className="posts-tab">收藏</div>
    <div className="posts-tab">歷史</div>
  </>
)}
```

### 4. 資料訪問權限總結

| 資料類型 | 自己 | 他人（已登入） | 訪客（未登入） |
|---------|------|--------------|--------------|
| 用戶基本資料 | ✅ 讀寫 | ✅ 唯讀 | ✅ 唯讀 |
| 貼文 | ✅ 讀寫 | ✅ 唯讀 | ✅ 唯讀 |
| 收藏 | ✅ 讀寫 | ❌ 無法訪問 | ❌ 無法訪問 |
| 歷史記錄 | ✅ 讀寫 | ❌ 無法訪問 | ❌ 無法訪問 |
| 通知 | ✅ 讀寫 | ❌ 無法訪問 | ❌ 無法訪問 |
| 好友關係 | ✅ 讀寫 | ⚠️ 部分可見 | ❌ 無法訪問 |

### 5. 安全性測試檢查清單

- [ ] 嘗試在瀏覽器控制台直接調用 `FirebaseService.getFavorites('其他用戶ID')` → 應返回空陣列
- [ ] 嘗試在瀏覽器控制台直接調用 `FirebaseService.getViewHistory('其他用戶ID')` → 應返回空陣列
- [ ] 訪問他人個人頁面時檢查網路請求 → 不應有 favorites 或 view_history 查詢
- [ ] 訪問他人個人頁面時檢查 UI → 不應顯示收藏和歷史標籤
- [ ] 使用 Firestore 模擬器測試規則 → 確保規則正確阻擋未授權訪問

## 最佳實踐

1. **永遠不要信任客戶端**：所有安全檢查都在 Firestore 規則層面實施
2. **多層防護**：UI、服務層、資料庫規則三層保護
3. **最小權限原則**：用戶只能訪問必要的資料
4. **警告日誌**：記錄所有安全相關的異常嘗試
5. **狀態重置**：切換用戶視圖時清理敏感狀態

## 更新日誌

### 2025-10-27 (第二次更新)
- ✅ 加強 Firestore 安全規則
- ✅ 貼文更新：只能更新自己的，且不能更改 userId
- ✅ 評論創建：必須確保 userId 是自己
- ✅ 讚：只能創建/刪除自己的，不允許更新
- ✅ 好友關係創建：必須是兩個用戶之一
- ✅ 通知創建：必須是發送者本人
- ✅ 用戶資料：防止修改 createdAt 等敏感欄位

### 2025-10-27 (第一次更新)
- ✅ 添加服務層安全檢查（getFavorites, getViewHistory）
- ✅ 添加 UI 層安全檢查（loadFavorites, loadViewHistory）
- ✅ URL 切換時強制重置 profileTab 為 'posts'
- ✅ 隱藏他人個人頁面的收藏和歷史標籤
- ✅ 文檔化所有安全措施
