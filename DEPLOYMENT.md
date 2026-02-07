# 部署指南

## 🚀 快速部署

### Web 版部署到 Firebase Hosting

```bash
# 1. 構建 Web 應用
cd web
npm run build

# 2. 部署到 Firebase
cd ..
firebase deploy --only hosting
```

### 移動端發布

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## 📋 詳細文檔

- [Firebase 完整設置](docs/deployment/FIREBASE_SETUP.md)
- [Firebase 快速開始](docs/deployment/FIREBASE_QUICKSTART.md)
- [Web 部署詳情](docs/deployment/WEB_DEPLOYMENT.md)
- [部署測試報告](docs/deployment/DEPLOY_TEST_REPORT.md)

## 🔑 環境變數設置

### Firebase 配置
1. 訪問 [Firebase Console](https://console.firebase.google.com/project/brobro-fd803)
2. 專案設定 → 一般 → 您的應用程式
3. 複製 Firebase 配置到 `src/config/firebase.ts` 和 `web/src/config/firebase.ts`

### Mapbox Token (Web)
1. 訪問 [Mapbox](https://account.mapbox.com/)
2. 創建 Access Token
3. 添加到 `web/src/config/mapbox.ts`

## ✅ 部署前檢查清單

- [ ] 運行測試 `npm test`
- [ ] 構建成功 `npm run build`
- [ ] 檢查 Firebase 規則
- [ ] 更新環境變數
- [ ] 測試生產構建 `npm run preview`
- [ ] 檢查 Analytics 設置

## 🔧 故障排除

### 構建失敗
```bash
# 清理並重新安裝
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Firebase 部署失敗
```bash
# 重新登入
firebase login --reauth

# 檢查專案
firebase projects:list
firebase use brobro-fd803
```

## 📊 生產環境監控

- **Firebase Console**: 即時數據庫、認證、儲存空間
- **Analytics**: 用戶行為追蹤
- **Performance Monitoring**: 性能指標

---

需要協助？查看 [完整部署文檔](docs/deployment/)
