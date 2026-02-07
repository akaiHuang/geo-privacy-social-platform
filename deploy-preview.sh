#!/bin/bash

# 安全的預覽部署腳本
# 這會建立一個臨時的預覽 channel，不會影響正式版

echo "🔍 檢查建置狀態..."

# 進入 web 目錄
cd web

# 建置專案
echo "📦 建置 Web 專案..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 建置失敗！"
    exit 1
fi

echo "✅ 建置成功！"

# 回到根目錄
cd ..

# 部署到預覽 channel (7天後自動過期)
echo "🚀 部署到預覽 channel..."
CHANNEL_ID="preview-$(date +%Y%m%d-%H%M%S)"

firebase hosting:channel:deploy $CHANNEL_ID --expires 7d

echo ""
echo "✅ 部署完成！"
echo "📝 預覽 URL 將在上方顯示"
echo "⏰ 此預覽將在 7 天後自動過期"
echo "🔒 正式版網站不受影響"
