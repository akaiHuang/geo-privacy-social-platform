# Firestore 安全規則測試指南

## 部署安全規則到 Firebase

```bash
# 部署新的安全規則
firebase deploy --only firestore:rules

# 查看部署狀態
firebase firestore:indexes
```

## 重要安全漏洞修復總結

### 🔴 修復前的漏洞

1. **貼文更新漏洞 (Critical)**
   - 任何登入用戶都能修改任何貼文
   - 可以更改貼文的 userId，冒充他人

2. **評論創建漏洞 (Critical)**
   - 可以設定任意 userId 創建評論
   - 可以冒充他人發表評論

3. **讚記錄漏洞 (High)**
   - 可以設定任意 userId 按讚
   - 可以冒充他人按讚

4. **好友關係漏洞 (High)**
   - 任何人都能創建任意兩個用戶的好友關係
   - 可以強制建立不存在的好友關係

5. **通知創建漏洞 (Medium)**
   - 可以發送假通知給任何人
   - 可以冒充系統發送通知

6. **用戶資料漏洞 (Medium)**
   - 可以修改 createdAt 等不可變欄位
   - 可能造成資料不一致

### ✅ 修復後的保護

所有操作都必須通過以下驗證：
- ✅ 只能操作自己的資料
- ✅ 不能更改 userId 欄位
- ✅ 不能修改不可變欄位（createdAt 等）
- ✅ 必須是相關當事人才能創建關係

## 手動測試步驟

### 測試 1: 嘗試修改他人貼文（應該失敗）

```javascript
// 在瀏覽器控制台執行
const otherUserPostId = 'some_post_id'; // 替換為他人的貼文 ID
const postRef = doc(db, 'posts', otherUserPostId);

// 這應該失敗
updateDoc(postRef, {
  content: '我試圖修改他人的貼文'
}).then(() => {
  console.error('❌ 安全漏洞：成功修改他人貼文！');
}).catch(() => {
  console.log('✅ 安全保護正常：無法修改他人貼文');
});
```

### 測試 2: 嘗試冒充他人發評論（應該失敗）

```javascript
// 嘗試創建一個 userId 不是自己的評論
const commentsRef = collection(db, 'comments');

addDoc(commentsRef, {
  postId: 'some_post_id',
  userId: 'other_user_id', // 冒充他人
  content: '我試圖冒充他人發評論',
  createdAt: new Date()
}).then(() => {
  console.error('❌ 安全漏洞：成功冒充他人發評論！');
}).catch(() => {
  console.log('✅ 安全保護正常：無法冒充他人發評論');
});
```

### 測試 3: 嘗試修改貼文的 userId（應該失敗）

```javascript
// 嘗試更改自己貼文的 userId
const myPostId = 'my_post_id'; // 替換為自己的貼文 ID
const postRef = doc(db, 'posts', myPostId);

updateDoc(postRef, {
  userId: 'other_user_id', // 嘗試更改 userId
  content: '更新內容'
}).then(() => {
  console.error('❌ 安全漏洞：成功更改貼文的 userId！');
}).catch(() => {
  console.log('✅ 安全保護正常：無法更改貼文的 userId');
});
```

### 測試 4: 嘗試冒充他人按讚（應該失敗）

```javascript
const likesRef = collection(db, 'likes');

addDoc(likesRef, {
  postId: 'some_post_id',
  userId: 'other_user_id', // 冒充他人
  createdAt: new Date()
}).then(() => {
  console.error('❌ 安全漏洞：成功冒充他人按讚！');
}).catch(() => {
  console.log('✅ 安全保護正常：無法冒充他人按讚');
});
```

### 測試 5: 嘗試創建任意好友關係（應該失敗）

```javascript
const friendshipsRef = collection(db, 'friendships');

addDoc(friendshipsRef, {
  userId1: 'user_a',
  userId2: 'user_b', // 兩個都不是自己
  createdAt: new Date()
}).then(() => {
  console.error('❌ 安全漏洞：成功創建任意好友關係！');
}).catch(() => {
  console.log('✅ 安全保護正常：無法創建無關的好友關係');
});
```

### 測試 6: 嘗試讀取他人的收藏（應該失敗）

```javascript
const favoritesQuery = query(
  collection(db, 'favorites'),
  where('userId', '==', 'other_user_id')
);

getDocs(favoritesQuery).then((snapshot) => {
  if (snapshot.empty) {
    console.log('✅ 安全保護正常：無法讀取他人收藏');
  } else {
    console.error('❌ 安全漏洞：成功讀取他人收藏！', snapshot.size, '筆');
  }
}).catch(() => {
  console.log('✅ 安全保護正常：查詢他人收藏被拒絕');
});
```

### 測試 7: 嘗試修改用戶的 createdAt（應該失敗）

```javascript
const currentUserId = auth.currentUser?.uid;
const userRef = doc(db, 'users', currentUserId);

updateDoc(userRef, {
  displayName: '新名稱', // 正常更新
  createdAt: new Date() // 嘗試修改不可變欄位
}).then(() => {
  console.error('❌ 安全漏洞：成功修改 createdAt！');
}).catch(() => {
  console.log('✅ 安全保護正常：無法修改 createdAt');
});
```

## 使用 Firestore 模擬器測試

### 1. 啟動模擬器

```bash
firebase emulators:start
```

### 2. 在瀏覽器訪問

```
http://localhost:4000/firestore
```

### 3. 手動測試規則

在模擬器 UI 中：
1. 選擇 "Rules" 標籤
2. 輸入測試案例
3. 驗證規則是否正確攔截

## 自動化測試腳本

創建 `firestore-security.test.js`：

```javascript
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'brobro-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  test('不能修改他人的貼文', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const bob = testEnv.authenticatedContext('bob');

    // Alice 創建貼文
    await assertSucceeds(
      alice.firestore().collection('posts').add({
        userId: 'alice',
        content: 'Alice 的貼文'
      })
    );

    // Bob 嘗試修改 Alice 的貼文（應該失敗）
    const postRef = alice.firestore().collection('posts').doc('post1');
    await assertFails(
      bob.firestore().collection('posts').doc('post1').update({
        content: 'Bob 試圖修改'
      })
    );
  });

  test('不能冒充他人發評論', async () => {
    const alice = testEnv.authenticatedContext('alice');

    // Alice 嘗試冒充 Bob 發評論（應該失敗）
    await assertFails(
      alice.firestore().collection('comments').add({
        postId: 'post1',
        userId: 'bob', // 冒充 Bob
        content: '冒充的評論'
      })
    );
  });

  test('只能讀取自己的收藏', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const bob = testEnv.authenticatedContext('bob');

    // Alice 嘗試讀取 Bob 的收藏（應該失敗）
    await assertFails(
      alice.firestore().collection('favorites')
        .where('userId', '==', 'bob')
        .get()
    );
  });
});
```

運行測試：

```bash
npm install --save-dev @firebase/rules-unit-testing
npm test
```

## 部署清單

- [ ] 1. 檢查所有規則修改
- [ ] 2. 在模擬器中測試規則
- [ ] 3. 運行自動化測試
- [ ] 4. 部署到 Firebase：`firebase deploy --only firestore:rules`
- [ ] 5. 在生產環境手動測試關鍵場景
- [ ] 6. 監控 Firebase Console 的安全警告
- [ ] 7. 檢查應用程式是否正常運作

## 監控建議

### Firebase Console

1. 訪問 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案 → Firestore Database
3. 查看 "Rules" 標籤
4. 監控 "Usage" 標籤的異常請求

### 設定警報

在 Firebase Console 設定以下警報：
- 大量的 permission-denied 錯誤
- 異常的讀取/寫入模式
- 規則評估時間過長

## 安全最佳實踐

1. ✅ **永遠在伺服器端驗證** - 客戶端檢查只是 UI 優化
2. ✅ **最小權限原則** - 只給必要的權限
3. ✅ **防止 userId 偽造** - 所有 userId 都要驗證
4. ✅ **保護不可變欄位** - createdAt, id 等不應被修改
5. ✅ **記錄安全事件** - 監控異常的權限拒絕
6. ✅ **定期審查規則** - 每次新功能都要更新規則
7. ✅ **測試先行** - 先寫測試，再寫規則

## 常見錯誤訊息

### permission-denied
```
FirebaseError: Missing or insufficient permissions.
```
**原因**：違反了 Firestore 安全規則
**解決**：檢查是否嘗試訪問未授權的資料

### PERMISSION_DENIED
```
code: "permission-denied"
message: "Missing or insufficient permissions."
```
**原因**：規則拒絕了此操作
**解決**：確認當前用戶有權限執行此操作
