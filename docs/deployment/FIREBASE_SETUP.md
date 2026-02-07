# Firebase 設置指南

本應用使用 Firebase 作為後端服務，包括：
- **Firebase Authentication** - 用戶認證
- **Cloud Firestore** - 數據庫
- **Firebase Storage** - 文件存儲
- **Firebase Analytics** - 分析（可選）

## Firebase 配置

Firebase 配置已在 `src/config/firebase.ts` 中設置：

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyBT1WDwsMka_JKuBvcYGRV7ZFrAdxJVop8",
  authDomain: "brobro-fd803.firebaseapp.com",
  projectId: "brobro-fd803",
  storageBucket: "brobro-fd803.firebasestorage.app",
  messagingSenderId: "792825622935",
  appId: "1:792825622935:web:fb25f09148ef5c9eec54d2",
  measurementId: "G-746WYX5FZY"
};
```

## Firebase Console 設置

### 1. Authentication 設置

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇您的項目 `brobro-fd803`
3. 點擊左側菜單的 **Authentication**
4. 點擊 **Get Started**
5. 啟用 **Email/Password** 登入方式

### 2. Firestore Database 設置

1. 在 Firebase Console 點擊 **Firestore Database**
2. 點擊 **Create Database**
3. 選擇 **Start in production mode**（或 test mode for development）
4. 選擇地區（建議選擇 asia-east1 或 asia-northeast1）

#### 設置安全規則

在 **Rules** 頁面，設置以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶數據
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 貼文
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // 評論
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // 點讚記錄
    match /likes/{likeId} {
      allow read: if true;
      allow create, delete: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 3. Storage 設置

1. 在 Firebase Console 點擊 **Storage**
2. 點擊 **Get Started**
3. 選擇安全規則模式

#### 設置存儲規則

在 **Rules** 頁面，設置以下規則：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{userId}/{allPaths=**} {
      // 只允許用戶上傳到自己的文件夾
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. 索引設置

為了提高查詢性能，在 Firestore 創建以下複合索引：

1. 前往 **Firestore Database > Indexes**
2. 點擊 **Create Index**

#### 索引 1：按用戶和時間查詢貼文
- Collection: `posts`
- Fields:
  - `userId` (Ascending)
  - `createdAt` (Descending)

#### 索引 2：按時間查詢評論
- Collection: `comments`
- Fields:
  - `postId` (Ascending)
  - `createdAt` (Descending)

## Firestore 數據結構

### Users Collection

```typescript
users/{userId}
{
  id: string
  username: string
  displayName: string
  avatar?: string
  bio?: string
  createdAt: Timestamp
}
```

### Posts Collection

```typescript
posts/{postId}
{
  userId: string
  user: {
    id: string
    username: string
    displayName: string
    avatar?: string
  }
  content: string
  media: Array<{
    id: string
    type: 'image' | 'video'
    uri: string
    thumbnail?: string
    duration?: number
  }>
  location: {
    latitude: number
    longitude: number
    address?: string
  }
  createdAt: Timestamp
  likes: number
  comments: number
}
```

### Comments Collection

```typescript
comments/{commentId}
{
  postId: string
  userId: string
  user: {
    id: string
    username: string
    displayName: string
    avatar?: string
  }
  content: string
  createdAt: Timestamp
}
```

### Likes Collection

```typescript
likes/{likeId}
{
  userId: string
  postId: string
  createdAt: Timestamp
}
```

## Storage 結構

```
storage/
└── {userId}/
    ├── images/
    │   └── {timestamp}.jpg
    └── videos/
        └── {timestamp}.mp4
```

## 服務使用說明

### 認證服務 (AuthService)

```typescript
import AuthService from './src/services/auth';

// 註冊
await AuthService.register(email, password, username, displayName);

// 登入
await AuthService.login(email, password);

// 登出
await AuthService.logout();

// 獲取當前用戶
const user = AuthService.getCurrentUser();

// 監聽認證狀態
AuthService.onAuthStateChange((user) => {
  console.log('User:', user);
});
```

### Firebase 服務 (FirebaseService)

```typescript
import FirebaseService from './src/services/firebase';

// 獲取貼文
const posts = await FirebaseService.getPosts();

// 創建貼文
await FirebaseService.createPost(postData);

// 點讚
await FirebaseService.likePost(postId);

// 創建評論
await FirebaseService.createComment(postId, content);
```

### 存儲服務 (StorageService)

```typescript
import StorageService from './src/services/storage';

// 上傳圖片
const imageUrl = await StorageService.uploadImage(imageUri);

// 上傳影片
const videoUrl = await StorageService.uploadVideo(videoUri);
```

## 本地開發

1. 確保已啟用 Firebase Authentication 的 Email/Password 登入
2. 設置正確的 Firestore 安全規則
3. 運行應用：`npm start`

## 生產部署注意事項

1. **安全規則**: 確保在生產環境使用嚴格的安全規則
2. **配額限制**: 注意 Firebase 免費方案的配額限制
3. **索引優化**: 根據實際查詢需求創建適當的索引
4. **備份**: 定期備份 Firestore 數據
5. **監控**: 使用 Firebase Console 監控使用情況和錯誤

## 費用估算（免費方案限制）

### Firestore
- 讀取：50,000 次/天
- 寫入：20,000 次/天
- 刪除：20,000 次/天
- 存儲：1 GB

### Storage
- 存儲：5 GB
- 下載：1 GB/天
- 上傳：30 GB/天

### Authentication
- 無限制（免費方案）

## 疑難排解

### 問題：無法登入
- 檢查 Firebase Console 中 Authentication 是否啟用
- 確認 Email/Password 登入方式已啟用

### 問題：無法讀取/寫入數據
- 檢查 Firestore 安全規則
- 確認用戶已登入
- 查看 Firebase Console 的錯誤日誌

### 問題：上傳失敗
- 檢查 Storage 安全規則
- 確認文件大小未超過限制
- 檢查網絡連接

## 相關鏈接

- [Firebase 文檔](https://firebase.google.com/docs)
- [Firestore 文檔](https://firebase.google.com/docs/firestore)
- [Firebase Authentication 文檔](https://firebase.google.com/docs/auth)
- [Firebase Storage 文檔](https://firebase.google.com/docs/storage)
