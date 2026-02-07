#!/bin/bash

# BroBro App 測試啟動腳本

echo "🚀 BroBro 地圖交友 App - 測試啟動腳本"
echo "========================================"
echo ""

# 檢查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次運行，安裝依賴中..."
    npm install
    echo ""
fi

# 顯示 Firebase Console 連結
echo "⚠️  測試前請確認 Firebase Console 已完成設定："
echo "🔗 https://console.firebase.google.com/project/brobro-fd803"
echo ""
echo "   需要啟用以下服務："
echo "   1. ✅ Authentication (Email/Password)"
echo "   2. ✅ Firestore Database (測試模式)"
echo "   3. ✅ Storage (測試模式)"
echo ""

# 詢問使用者是否已完成 Firebase 設定
read -p "❓ Firebase 設定是否已完成? (y/n): " firebase_ready

if [ "$firebase_ready" != "y" ] && [ "$firebase_ready" != "Y" ]; then
    echo ""
    echo "⚠️  請先完成 Firebase 設定，然後重新執行此腳本"
    echo "📖 詳細步驟請參考: FIREBASE_TESTING.md"
    exit 1
fi

echo ""
echo "✅ 太好了！準備啟動 App..."
echo ""

# 選擇啟動方式
echo "請選擇測試方式："
echo "1) 在手機上測試 (推薦 - 使用 Expo Go)"
echo "2) iOS 模擬器 (需要 Mac + Xcode)"
echo "3) Android 模擬器 (需要 Android Studio)"
echo "4) 清除快取後啟動"
echo ""

read -p "請輸入選項 (1-4): " option

case $option in
    1)
        echo ""
        echo "📱 啟動開發伺服器..."
        echo "   請使用 Expo Go App 掃描 QR Code"
        echo ""
        npm start
        ;;
    2)
        echo ""
        echo "🍎 啟動 iOS 模擬器..."
        npm run ios
        ;;
    3)
        echo ""
        echo "🤖 啟動 Android 模擬器..."
        echo "   請確認 Android 模擬器已在 Android Studio 中啟動"
        npm run android
        ;;
    4)
        echo ""
        echo "🧹 清除快取並啟動..."
        npx expo start -c
        ;;
    *)
        echo ""
        echo "❌ 無效的選項"
        exit 1
        ;;
esac
