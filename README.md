<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo_51-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Firebase-10.7-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
  <img src="https://img.shields.io/badge/Mapbox-GL_3.16-000000?style=for-the-badge&logo=mapbox&logoColor=white" alt="Mapbox" />
</p>

# Geo-Privacy Social Platform

### Location-Aware Social Network with 2km Privacy Fuzzing

> A **dual-platform social application** (mobile + web) that enables location-based content sharing while protecting user privacy through a **2km location fuzzing algorithm** using the Haversine formula.
>
> 具備地理隱私保護的社交平台 -- 透過 Haversine 公式實現 2 公里位置模糊化，同時支援 React Native 行動端與 React Web 端。

## About

Geo-Privacy Social Platform 是一款隱私優先的地理社交應用，透過位置模糊化等機制在「可分享」與「可保護」之間取得平衡。適合用於地理內容產品的原型驗證，或作為位置隱私設計（如 2km fuzzing）與雙平台架構的參考。

## About (EN)

Geo-Privacy Social Platform is a privacy-first location-aware social product that balances discoverability with user safety. It demonstrates geolocation sharing patterns with protective mechanisms such as location fuzzing.

## 📋 Quick Summary

> 🔒 **Geo-Privacy Social Platform** 是一款以「隱私優先」為核心設計理念的地理社交平台。📱 支援雙平台架構——React Native (Expo 51) 行動 App 加上 React (Vite) Web App，共享核心邏輯。🗺️ 最大特色是 **2km 位置模糊化演算法**：每則貼文發布時自動套用隨機位置偏移，確保使用者真實位置不被暴露。📐 運用 Haversine 球面距離公式進行精確的附近內容探索，在隱私保護與社交功能間取得完美平衡。💬 完整社交功能涵蓋即時貼文、留言、按讚、好友系統、通知、收藏與封鎖機制。🗄️ Firestore 後端設計了 10 個集合搭配 148 行安全規則，實現列級存取控制。🕐 獨特的時間旅行功能讓使用者透過時間軸滑桿探索歷史內容。🛠️ 技術棧包含 TypeScript 5.3、Mapbox GL、Firebase Auth/Storage，共計 63 個 TS 檔案約 10,460 行程式碼。適合需要位置感知但重視隱私保護的社交應用場景。

---

## ⭐ Highlights / 專案亮點

| Feature | Description |
|---------|-------------|
| **2km Privacy Fuzzing** | 每次發文自動套用隨機位置偏移（最大 2km），保護使用者真實位置 |
| **Dual Platform** | React Native (Expo) 行動 App + React (Vite) Web App，共享核心邏輯 |
| **Haversine Distance** | 使用 Haversine 公式精確計算球面距離，支援附近內容探索 |
| **148-line Security Rules** | Firestore 安全規則涵蓋 10 個集合，確保資料層級的存取控制 |
| **Real-time Social** | 即時貼文、留言、按讚、好友系統、通知、收藏、封鎖機制 |
| **Mapbox Integration** | 互動式地圖瀏覽，結合時間軸滑桿的時空內容探索 |

---

## 🏗️ Architecture / 系統架構

```
geo-privacy-social-platform/
│
├── App.tsx                          # Mobile Entry Point
│                                    # 認證狀態管理、路由切換
│
├── src/                             # Mobile App (React Native / Expo)
│   ├── screens/                     # 5 screens
│   │   ├── AuthScreen.tsx           #   登入 / 註冊
│   │   ├── FeedScreen.tsx           #   動態牆
│   │   ├── MapScreen.tsx            #   地圖瀏覽
│   │   ├── PostCreateScreen.tsx     #   發文（含位置模糊化）
│   │   └── ProfileScreen.tsx        #   個人檔案
│   │
│   ├── components/                  # Reusable UI Components
│   │   ├── common/                  #   Button, Input, Modal
│   │   ├── feed/                    #   FeedList
│   │   ├── map/                     #   MapView, LocationPicker
│   │   ├── post/                    #   PostCard, PostEditor, MediaUploader
│   │   └── profile/                 #   ProfileHeader, ProfileWall
│   │
│   ├── services/                    # Backend Services
│   │   ├── firebase.ts              #   Firestore CRUD (11.7KB)
│   │   ├── auth.ts                  #   Firebase Authentication
│   │   ├── location.ts              #   Location + privacy offset
│   │   └── storage.ts               #   Media file storage
│   │
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useAuth.ts               #   Authentication state
│   │   ├── usePosts.ts              #   Post CRUD + real-time sync
│   │   ├── useComments.ts           #   Comment management
│   │   └── useLocation.ts           #   Location tracking
│   │
│   └── utils/
│       ├── locationRandomizer.ts    #   2km fuzzing + Haversine formula
│       ├── timeSlot.ts              #   Time-based content filtering
│       ├── validators.ts            #   Input validation
│       └── constants.ts             #   App-wide constants
│
├── web/                             # Web App (React + Vite)
│   └── src/
│       ├── App.tsx                  #   Main web app (70.7KB)
│       ├── components/              #   18 web components
│       │   ├── ProfilePage.tsx      #     User profiles
│       │   ├── FullscreenPostViewer #     Immersive post viewing
│       │   ├── EditProfileModal.tsx #     Profile editing
│       │   ├── TimeSlider.tsx       #     Time-travel exploration
│       │   └── MapboxView.tsx       #     Mapbox GL integration
│       ├── services/                #   Firebase + analytics
│       ├── hooks/                   #   Auth, posts, comments, notifications
│       └── pages/                   #   Auth, Feed, Map, Notifications
│
├── firestore.rules                  # Security Rules (148 lines)
│                                    # 10 collections with row-level access control
│
└── firebase.json                    # Firebase configuration
```

---

## 🛠️ Tech Stack / 技術棧

```
  Mobile        React Native 0.74  +  Expo 51  |  iOS & Android
  Web           React 18  +  Vite 5  +  React Router 6
  Language      TypeScript 5.3  |  63 TS files, ~10,460 lines
  Backend       Firebase / Firestore  |  10 collections
  Maps          Mapbox GL 3.16  |  Leaflet  |  Google Maps API
  Auth          Firebase Authentication
  Storage       Firebase Storage (images, videos)
  Location      expo-location  +  Haversine formula
  Privacy       2km random offset on every post
```

---

## 🔐 Privacy Engineering / 隱私工程

### 2km Location Fuzzing Algorithm / 位置模糊化演算法

Every user-generated post automatically applies a **random location offset** within a 2km radius to prevent exact position exposure:

```typescript
// locationRandomizer.ts
const maxOffset = 0.018;  // ~2km in degrees latitude

const randomLat = (Math.random() - 0.5) * 2 * maxOffset;
const randomLng = (Math.random() - 0.5) * 2 * maxOffset;

return {
  latitude:  original.latitude  + randomLat,
  longitude: original.longitude + randomLng,
};
```

### Haversine Distance Calculation / 球面距離計算

Used for proximity-based content discovery within privacy boundaries:

```typescript
// Haversine formula for great-circle distance
const R = 6371;  // Earth radius in km
const dLat = toRad(loc2.latitude - loc1.latitude);
const dLon = toRad(loc2.longitude - loc1.longitude);

const a = sin(dLat/2)^2 + cos(lat1) * cos(lat2) * sin(dLon/2)^2;
const c = 2 * atan2(sqrt(a), sqrt(1-a));
const distance = R * c;  // Result in kilometers
```

### Privacy Flow / 隱私保護流程

```
User's Real Location
        |
        v
  [addLocationRandomOffset()]
        |
        v
  Fuzzed Location (+/- 2km)
        |
        v
  [Stored in Firestore]     -->  [Displayed on Map]
                                  (approximate area only)
```

---

## 🗄️ Firestore Data Model / 資料模型

### 10 Collections with Security Rules / 10 個集合與安全規則

| Collection | Description | Access Control |
|------------|-------------|----------------|
| `users` | User profiles / 使用者檔案 | Owner read/write only |
| `posts` | Location-tagged posts / 位置貼文 | Public read, owner write |
| `comments` | Post comments / 留言 | Public read, author write |
| `likes` | Like records / 按讚紀錄 | Public read, author create/delete |
| `friend_requests` | Friend requests / 好友請求 | Sender/receiver access |
| `friendships` | Friend relationships / 好友關係 | Both parties access |
| `blocks` | Block records / 封鎖紀錄 | Blocker access only |
| `notifications` | Push notifications / 通知 | Recipient access only |
| `favorites` | Saved posts / 收藏 | Owner access only |
| `view_history` | View history / 瀏覽歷史 | Owner access only |

### Security Rule Highlights / 安全規則重點

```javascript
// Immutable fields protection / 不可變欄位保護
allow update: if request.resource.data.createdAt == resource.data.createdAt;

// Identity verification / 身份驗證
allow create: if request.resource.data.userId == request.auth.uid;

// Cross-user isolation / 跨使用者隔離
allow read: if resource.data.userId == request.auth.uid;
```

---

## 🏁 Quick Start / 快速開始

### Mobile App (React Native + Expo)

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on specific platform
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser
```

### Web App (React + Vite)

```bash
cd web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase Hosting
npm run deploy
```

### Firebase Setup / Firebase 設定

```bash
# 1. Create a Firebase project at console.firebase.google.com
# 2. Enable Authentication (Email/Password)
# 3. Create a Firestore database
# 4. Update src/config/firebase.ts with your config
# 5. Deploy security rules
firebase deploy --only firestore:rules
```

---

## 🚀 Features / 功能列表

### Social / 社交功能
- User registration and authentication / 使用者註冊與認證
- User profiles with customizable URLs / 可自訂 URL 的個人檔案
- Post creation with text, images, and video / 圖文影音發文
- Comment and like system / 留言與按讚系統
- Friend request and friendship management / 好友請求與管理
- User blocking / 使用者封鎖
- Notification system / 通知系統
- Favorites / bookmarks / 收藏功能

### Location / 位置功能
- GPS-based location tagging / GPS 定位標記
- 2km privacy fuzzing on all posts / 所有貼文自動 2km 模糊化
- Haversine distance-based nearby discovery / 基於球面距離的附近探索
- Interactive Mapbox map view / 互動式 Mapbox 地圖
- Reverse geocoding / 反向地理編碼
- Location permission management / 位置權限管理

### Time Travel / 時間探索
- Timeline slider for historical content / 時間軸滑桿瀏覽歷史內容
- Time-slot based content filtering / 基於時段的內容篩選

---

## 📊 Project Stats / 專案統計

```
Total Files:       127
TypeScript Files:  63 files (~10,460 lines)
Mobile App:        React Native + Expo 51
Web App:           React 18 + Vite 5
Security Rules:    148 lines (10 collections)
Platforms:         iOS, Android, Web
```

---

## 📄 License

MIT License

---

<p align="center">
  <sub>Built with React Native, Firebase, and Mapbox for privacy-aware social networking.</sub>
  <br />
  <sub>結合 React Native、Firebase 與 Mapbox 打造的隱私優先社交平台。</sub>
</p>
