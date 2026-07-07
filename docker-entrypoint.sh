#!/bin/sh
set -e

echo "[entrypoint] DATABASE_URL=$DATABASE_URL"

# 1) Đảm bảo schema đã được đẩy vào DB (tạo bảng nếu chưa có). Idempotent.
echo "[entrypoint] prisma db push..."
npx prisma db push --skip-generate 2>/dev/null || npx prisma db push

# 2) Seed chỉ khi bảng Level còn rỗng (giữ data qua các lần restart).
echo "[entrypoint] kiểm tra seed..."
NEED_SEED=$(npx tsx -e "
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });
p.level.count().then((c) => { console.log(c === 0 ? 'YES' : 'NO'); return p.\$disconnect(); }).catch(() => { console.log('YES'); });
" 2>/dev/null | tr -d '[:space:]')

if [ "$NEED_SEED" = "YES" ]; then
  echo "[entrypoint] DB rỗng -> seed 20 levels..."
  npx prisma db seed
else
  echo "[entrypoint] DB đã có data -> bỏ qua seed."
fi

echo "[entrypoint] khởi động app: $@"
exec "$@"
