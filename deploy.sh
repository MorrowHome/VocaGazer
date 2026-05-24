#!/bin/bash
set -e

# ─── VOCALOID Music Hub VPS 一键部署/更新 ───

PINK='\033[38;2;255;107;157m'
CYAN='\033[38;2;57;190;185m'
PURPLE='\033[38;2;179;136;255m'
YELLOW='\033[38;2;255;196;140m'
RESET='\033[0m'

echo ""
echo -e "${PURPLE}  ♪ VOCALOID Music Hub VPS 部署脚本 ♪${RESET}"
echo ""

# ─── 自动检测项目目录 ───
# 优先当前目录（deploy.sh 所在位置），其次常见部署路径
if [ -f "$PWD/package.json" ] && grep -q '"next"' "$PWD/package.json" 2>/dev/null; then
  PROJECT_DIR="$PWD"
elif [ -f "/opt/vocaloid-hub/package.json" ]; then
  PROJECT_DIR="/opt/vocaloid-hub"
elif [ -f "$HOME/VocaGaretee/package.json" ]; then
  PROJECT_DIR="$HOME/VocaGaretee"
else
  PROJECT_DIR=""
fi

# ─── 拉取/克隆代码 ───
if [ -n "$PROJECT_DIR" ]; then
  cd "$PROJECT_DIR"
  echo -e "  ${CYAN}◉${RESET} 项目目录: ${PURPLE}$PROJECT_DIR${RESET}"
  # 检查是否 git 仓库
  if [ -d ".git" ]; then
    echo -e "${PINK}▶ 拉取最新代码 ...${RESET}"
    git stash 2>/dev/null || true        # 暂存本地改动（如 dev.db）
    git fetch --all && git checkout planA 2>/dev/null || git checkout -b planA origin/planA 2>/dev/null || true && git pull
    echo -e "  ${CYAN}✓${RESET} 代码已更新 (分支: planA)"
  fi
else
  echo -e "${PINK}▶ 未找到项目，开始克隆 ...${RESET}"
  git clone https://github.com/MorrowHome/VocaGazer.git /opt/vocaloid-hub
  cd /opt/vocaloid-hub
  PROJECT_DIR="/opt/vocaloid-hub"
  echo -e "  ${CYAN}✓${RESET} 代码已克隆到 ${PURPLE}/opt/vocaloid-hub${RESET}"
  git checkout planA 2>/dev/null || git checkout -b planA origin/planA 2>/dev/null || true
fi

# ─── 安装依赖 ───
echo -e "${PINK}▶ 安装依赖 ...${RESET}"
npm install --silent 2>/dev/null
echo -e "  ${CYAN}✓${RESET} 依赖安装完成"

# ─── 生成 Prisma ───
echo -e "${PINK}▶ 同步数据库 ...${RESET}"
npx prisma generate 2>/dev/null
npx prisma db push --accept-data-loss 2>/dev/null
echo -e "  ${CYAN}✓${RESET} 数据库同步完成"

# ─── 构建 ───
echo -e "${PINK}▶ 构建生产版本（可能需要几分钟，请耐心等待）...${RESET}"
echo -e "  ${YELLOW}▶${RESET} 内存限制: NODE_OPTIONS=${NODE_OPTIONS:- --max-old-space-size=2048}"
NODE_OPTIONS="${NODE_OPTIONS:- --max-old-space-size=2048}" npm run build
echo -e "  ${CYAN}✓${RESET} 构建完成"

# ─── 释放端口 ───
PORT=3000
echo -e "${PINK}▶ 检查端口 ${PORT} ...${RESET}"
if lsof -ti :$PORT &>/dev/null; then
  echo -e "  ${YELLOW}⚠ 端口 ${PORT} 被占用，正在释放...${RESET}"
  lsof -ti :$PORT | xargs kill -9 2>/dev/null
  sleep 1
fi
echo -e "  ${CYAN}✓${RESET} 端口可用"

# ─── 启动 ───
echo ""
echo -e "${PURPLE}⋆｡°✩ 启动生产服务器 ✩°｡⋆${RESET}"
echo -e "  ${CYAN}▶${RESET} 访问地址: ${PURPLE}http://localhost:${PORT}${RESET}"

PM2_NAME="voca-hub"
if command -v pm2 &>/dev/null; then
  echo -e "  ${YELLOW}▶${RESET} 使用 PM2 守护进程"
  pm2 delete "$PM2_NAME" 2>/dev/null || true
  TZ=Asia/Shanghai pm2 start npm --name "$PM2_NAME" -- start -- --port $PORT
  pm2 save
  echo -e "  ${CYAN}✓${RESET} PM2 已启动 (进程名: $PM2_NAME)"
  echo -e "  ${YELLOW}▶${RESET} 日志: ${CYAN}pm2 logs $PM2_NAME${RESET}"
  echo -e "  ${YELLOW}▶${RESET} 重启: ${CYAN}pm2 restart $PM2_NAME${RESET}"
  echo -e "  ${YELLOW}▶${RESET} 停止: ${CYAN}pm2 stop $PM2_NAME${RESET}"
else
  echo -e "  ${YELLOW}⚠${RESET} 未安装 PM2，建议: ${CYAN}npm i -g pm2${RESET}"
  echo ""
  TZ=Asia/Shanghai exec npm start -- --port $PORT
fi

echo ""
echo -e "${PURPLE}⋆｡°✩ 部署完成 ✩°｡⋆${RESET}"
