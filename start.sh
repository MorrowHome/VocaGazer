#!/bin/bash
set -e

# ─── VOCALOID Music Hub 一键启动 ───

echo "✦ VOCALOID Music Hub 启动中 ..."
echo ""

# 颜色
PINK='\033[38;2;255;107;157m'
CYAN='\033[38;2;57;190;185m'
PURPLE='\033[38;2;179;136;255m'
RESET='\033[0m'

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

# 4. 启动
echo ""
echo -e "${PURPLE}⋆｡°✩ 启动开发服务器 ✩°｡⋆${RESET}"
echo ""
npm run dev -- --hostname 0.0.0.0
