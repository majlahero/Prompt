#!/bin/sh
set -e

echo "[entrypoint] DATABASE_URL=$DATABASE_URL"

# 1) Đảm bảo schema đã được đẩy vào DB (tạo bảng nếu chưa có). Idempotent.
echo "[entrypoint] prisma db push..."
npx prisma db push --skip-generate 2>/dev/null || npx prisma db push

# 2) Luôn seed lại để cập nhật prompt/content mới nhất.
#    (seed.ts đã deleteMany trước khi tạo mới nên idempotent.)
echo "[entrypoint] seed 20 levels..."
npx prisma db seed

echo "[entrypoint] khởi động app: $@"
exec "$@"
