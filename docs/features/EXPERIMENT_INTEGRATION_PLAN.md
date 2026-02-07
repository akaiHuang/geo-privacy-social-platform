# 🧪 實驗性功能整合計劃

## 📍 當前狀態
- **分支**: `feature/experiment-full-profile-integration`
- **基於**: `feature/integrate-profile-with-map` (207522b)
- **目標**: 從壞掉的版本 (4853615) 提取完整個人頁面功能

## ✅ 已完成（第一階段）

### 1. 提取的文件
- ✅ `web/src/services/analytics.ts` - 完整的用戶行為追蹤系統
- ✅ `web/src/components/ProfilePage.tsx` - 完整個人頁面組件
- ✅ `web/src/components/ProfilePage.css` - 樣式文件
- ✅ `PRIVACY_ANALYTICS.md` - 隱私政策文檔
- ✅ `firestore.indexes.json` - Firestore 索引優化
- ✅ `web/src/main.tsx` - 簡化路由結構

### 2. 文件說明

#### AnalyticsService (240 行)
**功能**：
- 追蹤頁面瀏覽
- 追蹤貼文互動（按讚、收藏、留言）
- 追蹤社交互動（加好友）
- 追蹤地圖互動（時光旅行、縮放）
- 追蹤錯誤事件
- 追蹤用戶會話（登入/登出）

**優點**：
- 獨立服務，不影響現有邏輯
- 完整的隱私保護
- 可選擇性調用

#### ProfilePage vs PublicProfilePage
**ProfilePage 的優勢**：
- ✅ 完整的 Tab 切換（貼文/地圖A/地圖B/收藏/歷史）
- ✅ 智能返回按鈕（判斷是否從應用內導航）
- ✅ 訪客互動計數（每 5 次提示登入）
- ✅ 好友功能整合
- ✅ 路由使用 `/u/:username`

**PublicProfilePage 的問題**：
- ❌ 功能較簡化
- ❌ 沒有地圖 Tab
- ❌ 智能導航不完整
- ❌ 路由使用 `/@:username`（可能有編碼問題）

## ⏳ 待完成（第二階段）

### 核心任務：整合 App.tsx 的路由邏輯

**目標架構**（參考 4853615）：
```tsx
function App() {
  // 1. 認證邏輯（監聽登入狀態）
  // 2. 設置 Analytics 用戶
  
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/u/:username" element={<ProfilePage />} />
    </Routes>
  );
}

function MainApp({ user, isAuthenticated }) {
  // 原本的 App 邏輯（動態牆、地圖等）
}
```

**需要修改的部分**：

#### 1. App.tsx 結構重組
- [ ] 將現有的 App 函數重命名為 MainApp
- [ ] 創建新的 App 函數處理路由
- [ ] 提取認證邏輯到 App 層級
- [ ] 傳遞 user 和 isAuthenticated 到 MainApp 和 ProfilePage

#### 2. 整合 AnalyticsService
- [ ] 在登入時設置用戶
- [ ] 在各個互動點添加追蹤
- [ ] 追蹤頁面切換
- [ ] 追蹤地圖互動

#### 3. ProfilePage 路由整合
- [ ] 從 `/u/:username` 讀取參數
- [ ] 傳遞 currentUser 和 isAuthenticated
- [ ] 處理訪客模式
- [ ] 實現智能返回按鈕

## 🔍 關鍵差異比對

### main.tsx
```diff
// 舊版（現在的）
<Routes>
  <Route path="/" element={<App />} />
  <Route path="/@:username" element={<PublicProfilePageWrapper />} />
</Routes>

// 新版（要改成）
<BrowserRouter>
  <App />  // App 內部處理路由
</BrowserRouter>
```

### App.tsx 開頭
```diff
// 舊版（現在的）
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState(...);
  // ... 所有功能邏輯
}

// 新版（要改成）
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // 只處理認證和路由
  return (
    <Routes>
      <Route path="/" element={<MainApp user={user} />} />
      <Route path="/u/:username" element={<ProfilePage currentUser={user} />} />
    </Routes>
  );
}

function MainApp({ user, isAuthenticated }) {
  const [currentView, setCurrentView] = useState(...);
  // ... 所有功能邏輯
}
```

## ⚠️ 風險評估

### 高風險（可能破壞地圖）
1. **App.tsx 大重構** ⚠️⚠️⚠️
   - 需要移動大量代碼
   - 狀態管理可能出錯
   - **建議**: 一步一步來，隨時測試

### 中風險
2. **路由變更** ⚠️⚠️
   - 從 `/@username` 改為 `/u/:username`
   - **建議**: 保持向後兼容，或者添加重定向

### 低風險（應該安全）
3. **AnalyticsService 調用** ⚠️
   - 只是添加追蹤代碼
   - **建議**: 可選性添加，不影響主邏輯

## 🚀 執行步驟（第二階段）

### Step 1: 備份測試
```bash
# 在修改前，確保可以回退
git checkout -b backup-before-app-refactor
git checkout feature/experiment-full-profile-integration
```

### Step 2: App.tsx 重構（小心！）
1. 複製整個 App 函數內容到 MainApp
2. 創建新的 App 函數處理路由
3. 一邊改一邊測試每個功能

### Step 3: 測試清單
每完成一步就測試：
- [ ] 首頁載入
- [ ] 動態牆顯示
- [ ] **地圖 A 正常**
- [ ] **地圖 B 正常**
- [ ] **時光回溯正常**
- [ ] 個人頁面（`/u/username`）
- [ ] 訪客模式
- [ ] 登入/登出

### Step 4: Analytics 整合（可選）
如果前面都正常，再添加 Analytics 追蹤

## 📊 成功標準

### 必須達成
- ✅ 所有地圖功能正常（最重要！）
- ✅ 個人頁面路由正常 (`/u/:username`)
- ✅ 訪客模式工作正常
- ✅ 智能返回按鈕邏輯正確

### 期望達成
- ✅ AnalyticsService 整合
- ✅ 好友功能完整
- ✅ 地圖 Tab 在個人頁面顯示

### 可選
- 完整的 Firestore 索引部署
- 詳細的用戶行為追蹤

## 🔄 如果失敗怎麼辦

### 方案 A: 部分整合
只整合不影響地圖的部分：
- 保留 AnalyticsService
- 保留隱私文檔
- 放棄完整的 ProfilePage，只用部分邏輯

### 方案 B: 完全回退
```bash
git checkout feature/integrate-profile-with-map
git branch -D feature/experiment-full-profile-integration
```

### 方案 C: 分階段合併
先合併 AnalyticsService，測試OK後再繼續

## 📝 下一步行動

**立即可做**：
1. 查看 App.tsx 當前結構
2. 規劃重構步驟
3. 準備測試環境

**需要討論**：
- 是否要繼續完整整合？
- 還是只整合 AnalyticsService？
- 是否接受路由從 `/@` 改為 `/u/`？

---

**建立時間**: 2025-10-27
**分支**: feature/experiment-full-profile-integration
**安全備份**: feature/integrate-profile-with-map (207522b)
