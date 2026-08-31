#!/bin/bash
# 备份与 journal 只留 7 天，避免磁盘把站点拖慢
set -euo pipefail
BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
if [ -d "$BACKUP_DIR" ]; then
  find "$BACKUP_DIR" -type f -mtime +7 -delete || true
  echo "▶ 已清理 7 天前备份: $BACKUP_DIR"
fi
if command -v journalctl >/dev/null 2>&1; then
  journalctl --vacuum-time=7d >/dev/null 2>&1 || true
  echo "▶ journald 已限制为 7 天"
fi
