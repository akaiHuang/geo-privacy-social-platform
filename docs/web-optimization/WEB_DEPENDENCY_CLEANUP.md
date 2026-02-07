# 依賴清理建議

## 🗑️ 未使用的依賴

檢測到以下未使用的依賴包，建議移除以減少 `node_modules` 大小：

### 未使用的地圖庫
```json
{
  "@react-google-maps/api": "^2.20.7",  // ❌ 未使用
  "leaflet": "^1.9.4",                   // ❌ 未使用
  "react-leaflet": "^4.2.1",             // ❌ 未使用
  "@types/leaflet": "^1.9.21"            // ❌ 未使用
}
```

**說明**: 專案僅使用 `mapbox-gl` 和 `react-map-gl`，上述 Google Maps 和 Leaflet 相關依賴均未使用。

---

## 📦 移除步驟

```bash
cd web

# 移除未使用的依賴
npm uninstall @react-google-maps/api leaflet react-leaflet @types/leaflet

# 清理 node_modules 和重新安裝
rm -rf node_modules package-lock.json
npm install
```

---

## 💾 預估節省空間

| 依賴包 | 大小 | 說明 |
|--------|------|------|
| @react-google-maps/api | ~2.5MB | Google Maps React |
| leaflet | ~500KB | Leaflet 地圖庫 |
| react-leaflet | ~200KB | Leaflet React 包裝器 |
| @types/leaflet | ~100KB | TypeScript 定義 |
| **總計** | **~3.3MB** | **可節省空間** |

---

## ✅ 優化後的 package.json

```json
{
  "dependencies": {
    "firebase": "^10.7.1",
    "mapbox-gl": "^3.16.0",           // ✅ 使用中
    "@types/mapbox-gl": "^3.4.1",     // ✅ 使用中
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-easy-crop": "^5.5.3",
    "react-map-gl": "^8.1.0",         // ✅ 使用中
    "react-router-dom": "^6.20.0"
  }
}
```

---

## 🔍 其他建議檢查

### 檢查未使用的依賴
```bash
npx depcheck
```

### 分析 Bundle 大小
```bash
npm run build
npx vite-bundle-visualizer
```

### 檢查過時的依賴
```bash
npm outdated
```

---

## 📊 預期效果

| 指標 | 優化前 | 優化後 | 改善 |
|------|--------|--------|------|
| node_modules 大小 | ~250MB | ~247MB | -3.3MB |
| 安裝時間 | ~45s | ~40s | -11% |
| 潛在衝突風險 | 中 | 低 | ✅ |

---

## ⚠️ 注意事項

1. **確保移除前**
   - 檢查所有組件是否真的不使用這些庫
   - 檢查 `time-travel-demo.html` 等靜態文件

2. **移除後測試**
   ```bash
   npm run build
   npm run preview
   ```

3. **版本控制**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: remove unused map dependencies"
   ```

---

最後更新: 2025年10月27日
