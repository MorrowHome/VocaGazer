#!/bin/bash
set -e

# ─── VOCALOID Music Hub 局域网启动 ───
# 局域网内的其他设备（手机、平板、其他电脑）可通过 http://IP:3000 访问

PINK='\033[38;2;255;107;157m'
CYAN='\033[38;2;57;190;185m'
PURPLE='\033[38;2;179;136;255m'
YELLOW='\033[38;2;255;196;140m'
RESET='\033[0m'

# 获取本机局域网 IP
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || ifconfig en0 2>/dev/null | grep 'inet ' | awk '{print $2}' || hostname -I 2>/dev/null | awk '{print $1}' || echo "请自行查看本机IP")

echo ""
echo -e "${PURPLE}  ♪ VOCALOID Music Hub ♪${RESET}"
echo -e "${YELLOW}  局域网共享模式${RESET}"
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

# 4. 启动
echo ""
echo -e "${PURPLE}⋆｡°✩ 启动开发服务器 ✩°｡⋆${RESET}"
echo -e "  ${CYAN}▶${RESET} 本机访问: ${PURPLE}http://localhost:3000${RESET}"
echo -e "  ${YELLOW}▶${RESET} 局域网访问: ${YELLOW}http://${LAN_IP}:3000${RESET}"
echo -e "  ${PINK}▶${RESET} 手机扫码或浏览器打开上方地址即可"
echo ""

# 监听所有网络接口
exec npm run dev -- -H 0.0.0.0 -p 3000
