#!/bin/bash

# 程式碼健康檢查腳本

echo "🔍 BroBro App - 程式碼健康檢查"
echo "================================"
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查計數
checks_passed=0
checks_failed=0

# 1. 檢查 Node.js
echo "1️⃣  檢查 Node.js..."
if command -v node &> /dev/null; then
    node_version=$(node -v)
    echo -e "${GREEN}✅ Node.js 已安裝: $node_version${NC}"
    ((checks_passed++))
else
    echo -e "${RED}❌ Node.js 未安裝${NC}"
    ((checks_failed++))
fi
echo ""

# 2. 檢查 npm
echo "2️⃣  檢查 npm..."
if command -v npm &> /dev/null; then
    npm_version=$(npm -v)
    echo -e "${GREEN}✅ npm 已安裝: $npm_version${NC}"
    ((checks_passed++))
else
    echo -e "${RED}❌ npm 未安裝${NC}"
    ((checks_failed++))
fi
echo ""

# 3. 檢查依賴是否已安裝
echo "3️⃣  檢查專案依賴..."
if [ -d "node_modules" ]; then
    module_count=$(ls -1 node_modules | wc -l)
    echo -e "${GREEN}✅ 依賴已安裝 ($module_count 個模組)${NC}"
    ((checks_passed++))
else
    echo -e "${YELLOW}⚠️  依賴未安裝，請執行: npm install${NC}"
    ((checks_failed++))
fi
echo ""

# 4. 檢查關鍵檔案
echo "4️⃣  檢查關鍵檔案..."
critical_files=(
    "package.json"
    "App.tsx"
    "src/config/firebase.ts"
    "src/services/firebase.ts"
    "src/services/auth.ts"
    "src/navigation/AppNavigator.tsx"
)

all_files_exist=true
for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}  ✓ $file${NC}"
    else
        echo -e "${RED}  ✗ $file (缺失)${NC}"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    ((checks_passed++))
else
    ((checks_failed++))
fi
echo ""

# 5. 檢查 Firebase 配置
echo "5️⃣  檢查 Firebase 配置..."
if [ -f "src/config/firebase.ts" ]; then
    if grep -q "brobro-fd803" src/config/firebase.ts; then
        echo -e "${GREEN}✅ Firebase 配置已完成 (Project: brobro-fd803)${NC}"
        ((checks_passed++))
    else
        echo -e "${RED}❌ Firebase 配置未完成${NC}"
        ((checks_failed++))
    fi
else
    echo -e "${RED}❌ firebase.ts 檔案不存在${NC}"
    ((checks_failed++))
fi
echo ""

# 6. 檢查 TypeScript 配置
echo "6️⃣  檢查 TypeScript 配置..."
if [ -f "tsconfig.json" ]; then
    echo -e "${GREEN}✅ tsconfig.json 存在${NC}"
    ((checks_passed++))
else
    echo -e "${RED}❌ tsconfig.json 不存在${NC}"
    ((checks_failed++))
fi
echo ""

# 7. 檢查 Git 狀態
echo "7️⃣  檢查 Git 狀態..."
if [ -d ".git" ]; then
    if git diff-index --quiet HEAD --; then
        echo -e "${GREEN}✅ Git 工作區乾淨${NC}"
    else
        echo -e "${YELLOW}⚠️  有未提交的變更${NC}"
        git status --short
    fi
    ((checks_passed++))
else
    echo -e "${RED}❌ Git 未初始化${NC}"
    ((checks_failed++))
fi
echo ""

# 8. 檢查文檔
echo "8️⃣  檢查文檔完整性..."
doc_files=(
    "README.md"
    "FIREBASE_SETUP.md"
    "FIREBASE_QUICKSTART.md"
    "FIREBASE_TESTING.md"
    "QUICKSTART.md"
)

all_docs_exist=true
for doc in "${doc_files[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}  ✓ $doc${NC}"
    else
        echo -e "${RED}  ✗ $doc (缺失)${NC}"
        all_docs_exist=false
    fi
done

if [ "$all_docs_exist" = true ]; then
    ((checks_passed++))
else
    ((checks_failed++))
fi
echo ""

# 總結
echo "================================"
echo "📊 檢查總結"
echo "================================"
echo -e "${GREEN}✅ 通過: $checks_passed${NC}"
echo -e "${RED}❌ 失敗: $checks_failed${NC}"
echo ""

if [ $checks_failed -eq 0 ]; then
    echo -e "${GREEN}🎉 所有檢查通過！專案準備就緒！${NC}"
    echo ""
    echo "📱 下一步："
    echo "   1. 確認 Firebase Console 設定完成"
    echo "   2. 執行 ./test.sh 啟動測試"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  有 $checks_failed 項檢查未通過${NC}"
    echo ""
    echo "🔧 建議修復步驟："
    if [ ! -d "node_modules" ]; then
        echo "   • 執行: npm install"
    fi
    if [ ! -d ".git" ]; then
        echo "   • 執行: git init"
    fi
    echo ""
    exit 1
fi
