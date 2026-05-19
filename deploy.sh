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

# ─── 配置（按需修改） ───
REPO_URL="https://github.com/morrowstudio/VocaGaretee.git"
INSTALL_DIR="$HOME/VocaGaretee"
PORT=3000

# ─── 第一步：拉取最新代码 ───
echo -e "${PINK}▶ 拉取最新代码 ...${RESET}"
if [ -d "$INSTALL_DIR" ]; then
  cd "$INSTALL_DIR"
  git pull
  echo -e "  ${CYAN}✓${RESET} 代码已更新"
else
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  echo -e "  ${CYAN}✓${RESET} 代码已克隆"
fi

# ─── 第二步：安装依赖 ───
echo -e "${PINK}▶ 安装依赖 ...${RESET}"
npm install --silent 2>/dev/null
echo -e "  ${CYAN}✓${RESET} 依赖安装完成"

# ─── 第三步：生成 Prisma 客户端 ───
echo -e "${PINK}▶ 生成 Prisma 客户端 ...${RESET}"
npx prisma generate 2>/dev/null
echo -e "  ${CYAN}✓${RESET} Prisma 客户端生成完成"

# ─── 第四步：同步数据库 ───
echo -e "${PINK}▶ 同步数据库 ...${RESET}"
npx prisma db push --accept-data-loss 2>/dev/null
echo -e "  ${CYAN}✓${RESET} 数据库同步完成"

# ─── 第五步：构建 ───
echo -e "${PINK}▶ 构建生产版本 ...${RESET}"
npm run build 2>&1 | tail -3
echo -e "  ${CYAN}✓${RESET} 构建完成"

# ─── 第六步：释放端口 ───
echo -e "${PINK}▶ 检查端口 ${PORT} ...${RESET}"
if lsof -ti :$PORT &>/dev/null; then
  echo -e "  ${YELLOW}⚠ 端口 ${PORT} 被占用，正在释放...${RESET}"
  lsof -ti :$PORT | xargs kill -9 2>/dev/null
  sleep 1
fi
echo -e "  ${CYAN}✓${RESET} 端口可用"

# ─── 第七步：启动 ───
echo ""
echo -e "${PURPLE}⋆｡°✩ 启动生产服务器 ✩°｡⋆${RESET}"
echo -e "  ${CYAN}▶${RESET} 访问地址: ${PURPLE}http://localhost:${PORT}${RESET}"
if command -v pm2 &>/dev/null; then
  # 用 PM2 启动（后台守护，重启后自动恢复）
  echo -e "  ${YELLOW}▶${RESET} 使用 PM2 守护进程"
  pm2 delete voca-hub 2>/dev/null || true
  TZ=Asia/Shanghai pm2 start npm --name voca-hub -- start -- --port $PORT
  pm2 save
  echo -e "  ${CYAN}✓${RESET} PM2 已启动 (进程名: voca-hub)"
  echo -e "  ${YELLOW}▶${RESET} 查看日志: ${CYAN}pm2 logs voca-hub${RESET}"
  echo -e "  ${YELLOW}▶${RESET} 重启: ${CYAN}pm2 restart voca-hub${RESET}"
  echo -e "  ${YELLOW}▶${RESET} 停止: ${CYAN}pm2 stop voca-hub${RESET}"
else
  # 没有 PM2，直接前台启动
  echo -e "  ${YELLOW}⚠${RESET} 未安装 PM2，建议安装: ${CYAN}npm i -g pm2${RESET}"
  echo -e "  ${YELLOW}▶${RESET} 现在使用前台模式启动"
  echo ""
  TZ=Asia/Shanghai exec npm start -- --port $PORT
fi

echo ""
echo -e "${PURPLE}⋆｡°✩ 部署完成 ✩°｡⋆${RESET}"
