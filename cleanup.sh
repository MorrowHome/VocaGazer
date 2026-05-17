#!/bin/bash
set -e

# ─── VOCALOID Music Hub 一键清洗 ───

PINK='\033[38;2;255;107;157m'
CYAN='\033[38;2;57;190;185m'
PURPLE='\033[38;2;179;136;255m'
YELLOW='\033[38;2;255;196;140m'
RESET='\033[0m'

echo ""
echo -e "${PURPLE}  ♪ VOCALOID Music Hub ♪${RESET}"
echo -e "${YELLOW}  一键数据清洗${RESET}"
echo ""

ARGS="$@"

# 1. 确保 Prisma 客户端
echo -e "${PINK}▶ 检查 Prisma 客户端 ...${RESET}"
npx prisma generate 2>/dev/null
echo -e "  ${CYAN}✓${RESET} Prisma 就绪"

# 2. 执行清洗
echo -e "${PINK}▶ 开始清洗${RESET}"
if [[ "$ARGS" == *"--dry-run"* ]]; then
  echo -e "  ${YELLOW}▶${RESET} 预览模式（不会删除数据）"
fi
echo ""

START=$(date +%s)
npx tsx scripts/cleanup.ts $ARGS
END=$(date +%s)

ELAPSED=$((END - START))
echo ""
echo -e "${PURPLE}⋆｡°✩ 清洗完成 ✩°｡⋆${RESET}"
echo -e "  ${CYAN}▶${RESET} 耗时: ${ELAPSED}s"
