# 地圖崩潰問題修復報告

## 問題描述
地圖視圖無法載入,瀏覽器陷入無限循環並崩潰。

## 根本原因分析

### 1. MapboxView.tsx 的問題
- **`reuseMaps` 屬性** (line 63): 此屬性在頻繁切換視圖時會導致 Mapbox GL JS 實例管理衝突
- **`onLoad` 回調中的 resize** (line 73-75): 在地圖載入完成時立即調用 `resize()` 可能在 DOM 未完全準備好時觸發錯誤
- **`resize()` 方法使用 `requestAnimationFrame`** (line 48): 相比 `setTimeout`,在某些情況下可能不夠穩定

### 2. App.tsx 的問題
- **useEffect 依賴不完整** (line 1013): 在 MainApp 組件中,useEffect 使用了 `user` 和 `posts`,但依賴陣列中只有 `[pathname]`,導致潛在的無限循環

## 修復內容

### MapboxView.tsx
```typescript
// ❌ 移除 (導致問題)
reuseMaps
onLoad={() => {
  mapRef.current?.resize();
}}

// ✅ 修復 resize 方法
resize: () => {
  const instance = mapRef.current;
  if (instance) {
    // 使用 setTimeout 確保 DOM 完全更新
    setTimeout(() => {
      try {
        instance.resize();
      } catch (error) {
        console.error('地圖 resize 失敗:', error);
      }
    }, 100);
  }
}
```

### App.tsx
```typescript
// ❌ 原本的依賴
}, [pathname]); // 只依賴 pathname 字符串，更穩定

// ✅ 修復後的依賴
}, [pathname, user?.username]); // 新增 user?.username 依賴，避免使用整個 posts 陣列

// ✅ 增加錯誤處理
if (currentView === 'mapB' && mapBRef.current) {
  const timer = setTimeout(() => {
    try {
      mapBRef.current?.resize();
    } catch (error) {
      console.error('地圖B resize 失敗:', error);
    }
  }, 150);
  return () => clearTimeout(timer);
}
```

## 變更對比

對比 commit `9890db5` (修復地圖A互動功能) 與當前版本:

### MapboxView.tsx 主要變更
- 移除 `reuseMaps` 屬性
- 移除 `onLoad` 回調
- `resize()` 方法改回使用 `setTimeout` 並增加錯誤處理
- 保持 `MapRef` 類型定義 (這是好的改進)

### App.tsx 主要變更  
- 修復 useEffect 依賴陣列,加入 `user?.username`
- 在地圖 resize 操作中增加錯誤處理

## 測試建議

1. **切換視圖測試**: 
   - 在 Feed、地圖A、地圖B、Profile 之間頻繁切換
   - 確認地圖能正確載入和釋放

2. **地圖互動測試**:
   - 點擊地圖標記
   - 使用時間軸滑桿
   - 確認地圖能正確飛行到指定位置

3. **效能測試**:
   - 開啟瀏覽器開發者工具的 Performance 標籤
   - 監控記憶體使用情況
   - 確認沒有記憶體洩漏

4. **長時間使用測試**:
   - 讓應用程式運行較長時間
   - 確認沒有逐漸變慢的情況

## 預防措施

1. **避免在 map 組件上使用 `reuseMaps`**: 除非確定需要,否則不要使用此屬性
2. **謹慎處理 resize**: 始終在 setTimeout 或 requestAnimationFrame 中調用,並加上錯誤處理
3. **正確設定 useEffect 依賴**: 確保所有使用到的變數都在依賴陣列中
4. **使用 React DevTools Profiler**: 定期檢查組件渲染次數,避免不必要的重渲染

## 參考連結

- Mapbox GL JS API: https://docs.mapbox.com/mapbox-gl-js/api/
- React useEffect Hook: https://react.dev/reference/react/useEffect
- React.memo 優化: https://react.dev/reference/react/memo

## 修復日期
2025年1月26日
