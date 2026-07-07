#!/usr/bin/env bash
# Auto-deploy: kéo master mới nhất và rebuild container app.
# Được webhook listener gọi. Chạy tuần tự nhờ flock (tránh 2 deploy chồng nhau).
set -euo pipefail

# Khi chạy dưới systemd, môi trường tối giản: ép các biến git cần, tắt hỏi
# credential (repo public -> fetch ẩn danh; nếu cần auth thì fail nhanh, không treo).
export HOME="/home/hoa"
export GIT_TERMINAL_PROMPT=0

REPO_DIR="/home/hoa/Prompt"
BRANCH="master"
LOG="$REPO_DIR/deploy/deploy.log"

cd "$REPO_DIR"

# Khoá: nếu đang có deploy chạy thì bỏ qua lần này.
exec 9>"$REPO_DIR/deploy/.deploy.lock"
if ! flock -n 9; then
  echo "[$(date -u +%FT%TZ)] deploy đang chạy, bỏ qua." >>"$LOG"
  exit 0
fi

{
  echo "===== deploy $(date -u +%FT%TZ) ====="
  git fetch origin "$BRANCH"
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse "origin/$BRANCH")
  if [ "$LOCAL" = "$REMOTE" ]; then
    echo "Không có commit mới ($LOCAL). Bỏ qua."
    exit 0
  fi
  echo "Cập nhật $LOCAL -> $REMOTE"
  git reset --hard "origin/$BRANCH"
  docker compose build app
  docker compose up -d
  echo "Deploy xong lúc $(date -u +%FT%TZ)."
} >>"$LOG" 2>&1
