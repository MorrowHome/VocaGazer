#!/bin/bash
# VPS 生产部署：拉 main、同步 schema、构建、重启 PM2
# 由 GitHub Actions 在 push main 后 SSH 调用；也可在服务器上手动执行。
set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/vocaloid-hub}"
PM2_NAME="${PM2_NAME:-voca-hub}"
PORT="${PORT:-3000}"
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=768}"
export NODE_OPTIONS
export TZ="${TZ:-Asia/Shanghai}"

cd "$PROJECT_DIR"

echo "▶ 项目目录: $PROJECT_DIR"

if [ ! -d .git ]; then
  echo "✗ $PROJECT_DIR 不是 git 仓库"
  exit 1
fi

if [ ! -f .env ]; then
  echo "✗ 缺少 .env（需要 DATABASE_URL、JWT_SECRET、CRON_SECRET）"
  exit 1
fi

if ! grep -q '^JWT_SECRET=' .env; then
  echo "✗ .env 未设置 JWT_SECRET，生产环境无法签发登录令牌"
  exit 1
fi

git stash push -m "deploy-stash" -- package-lock.json >/dev/null 2>&1 || true
git fetch origin main
git checkout -B main origin/main
git pull --ff-only origin main

echo "▶ 当前提交: $(git rev-parse --short HEAD) $(git log -1 --pretty=%s)"

echo "▶ 安装依赖"
npm ci

echo "▶ 同步数据库 schema（不加 --accept-data-loss）"
npx prisma generate
npx prisma db push --skip-generate

echo "▶ 构建（NODE_OPTIONS=$NODE_OPTIONS）"
npm run build

if ! command -v pm2 >/dev/null 2>&1; then
  echo "✗ 未安装 pm2"
  exit 1
fi

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  echo "▶ 重启 PM2: $PM2_NAME"
  pm2 restart "$PM2_NAME" --update-env
else
  echo "▶ 首次启动 PM2: $PM2_NAME"
  pm2 start npm --name "$PM2_NAME" -- start -- --port "$PORT"
  pm2 save
fi

echo "✓ 部署完成: https://morrowhome.site/"
