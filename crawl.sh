#!/bin/bash
set -e

# ─── VOCALOID Music Hub 一键采集 ───

PINK='\033[38;2;255;107;157m'
CYAN='\033[38;2;57;190;185m'
PURPLE='\033[38;2;179;136;255m'
YELLOW='\033[38;2;255;196;140m'
RESET='\033[0m'

echo ""
echo -e "${PURPLE}  ♪ VOCALOID Music Hub ♪${RESET}"
echo -e "${YELLOW}  一键采集${RESET}"
echo ""

# 参数解析
HOURS=72
VERBOSE=""
ARGS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --hours) HOURS="$2"; shift 2 ;;
    --today) HOURS=24; shift ;;
    --week) HOURS=168; shift ;;
    -v|--verbose) VERBOSE="--verbose"; shift ;;
    -h|--help)
      echo "用法: ./crawl.sh [选项]"
      echo ""
      echo "选项:"
      echo "  --today       仅采集最近 24 小时"
      echo "  --week        采集最近一周 (168 小时)"
      echo "  --hours N     自定义采集范围 (小时)"
      echo "  -v, --verbose 显示详细日志"
      echo "  -h, --help    显示帮助"
      exit 0
      ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

# 1. 确保 Prisma 生成
echo -e "${PINK}▶ 检查 Prisma 客户端 ...${RESET}"
npx prisma generate 2>/dev/null
echo -e "  ${CYAN}✓${RESET} Prisma 就绪"

# 2. 执行采集
echo -e "${PINK}▶ 开始采集${RESET}"
echo -e "  ${CYAN}▶${RESET} 时间范围: 最近 ${HOURS} 小时"
echo ""

START=$(date +%s)
npx tsx scripts/crawl.ts --hours "$HOURS" $VERBOSE
END=$(date +%s)

# 3. 完成
ELAPSED=$((END - START))
echo ""
echo -e "${PURPLE}⋆｡°✩ 采集完成 ✩°｡⋆${RESET}"
echo -e "  ${CYAN}▶${RESET} 耗时: ${ELAPSED}s"

if command -v say &>/dev/null; then
  say "采集完成" 2>/dev/null || true
fi
