#!/bin/bash
set -e

# ─── VOCALOID Music Hub 本地启动 ───

PINK='\033[38;2;255;107;157m'
CYAN='\033[38;2;57;190;185m'
PURPLE='\033[38;2;179;136;255m'
RESET='\033[0m'

echo ""
echo -e "${PURPLE}  ♪ VOCALOID Music Hub ♪${RESET}"
echo -e "${PURPLE}  本地开发模式${RESET}"
echo ""

# 1. 安装依赖
echo -e "${PINK}▶ 安装依赖 ...${RESET}"
npm install --silent 2>/dev/null
echo -e "  ${CYAN}✓${RESET} 依赖安装完成"

# 2. 生成 Prisma 客户端
echo -e "${PINK}▶ 生成 Prisma 客户端 ...${RESET}"
npx prisma generate 2>/dev/null
echo -e "  ${CYAN}✓${RESET} Prisma 客户端生成完成"

# 3. 同步数据库
echo -e "${PINK}▶ 同步数据库 ...${RESET}"
npx prisma db push --accept-data-loss 2>/dev/null
echo -e "  ${CYAN}✓${RESET} 数据库同步完成"

# 4. 释放端口（如果被占用）
echo -e "${PINK}▶ 检查端口 3000 ...${RESET}"
if lsof -ti :3000 &>/dev/null; then
  echo -e "  ${YELLOW}⚠ 端口 3000 被占用，正在释放...${RESET}"
  lsof -ti :3000 | xargs kill -9 2>/dev/null
  sleep 1
  echo -e "  ${CYAN}✓${RESET} 端口已释放"
else
  echo -e "  ${CYAN}✓${RESET} 端口可用"
fi

# 5. 启动
echo ""
echo -e "${PURPLE}⋆｡°✩ 启动开发服务器 ✩°｡⋆${RESET}"
echo -e "  ${CYAN}▶${RESET} 访问地址: ${PURPLE}http://localhost:3000${RESET}"
echo ""

# 仅监听本地回环
exec npm run dev -- -H 127.0.0.1 -p 3000
