#!/bin/bash
# Xin SSL cert lần đầu cho trochoi.id.vn bằng Let's Encrypt.
# Chạy 1 lần trên server sau khi DNS đã trỏ về IP máy.
set -e

DOMAIN="trochoi.id.vn"
WWW_DOMAIN="www.trochoi.id.vn"
EMAIL="admin@trochoi.id.vn"   # <-- ĐỔI thành email thật của bạn để nhận cảnh báo hết hạn
STAGING=0                      # đặt =1 để test (cert giả, không bị rate-limit của Let's Encrypt)

cd "$(dirname "$0")"

if ! [ -x "$(command -v docker)" ]; then
  echo "Lỗi: chưa cài docker." >&2
  exit 1
fi

mkdir -p certbot/conf certbot/www nginx/conf.d

echo "### Bước 1: dùng cấu hình nginx BOOTSTRAP (chỉ HTTP)..."
cp nginx/conf.d/app.conf nginx/conf.d/app.conf.bak 2>/dev/null || true
rm -f nginx/conf.d/app.conf
cp nginx/conf.d/bootstrap.conf.disabled nginx/conf.d/bootstrap.conf

echo "### Bước 2: khởi động app + nginx..."
docker compose up -d --build app nginx
sleep 5

echo "### Bước 3: xin certificate..."
STAGING_ARG=""
if [ "$STAGING" != "0" ]; then STAGING_ARG="--staging"; fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    -d $DOMAIN -d $WWW_DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --no-eff-email \
    --non-interactive" certbot

echo "### Bước 4: chuyển sang cấu hình HTTPS đầy đủ..."
rm -f nginx/conf.d/bootstrap.conf
cp nginx/conf.d/app.conf.bak nginx/conf.d/app.conf 2>/dev/null || git checkout nginx/conf.d/app.conf 2>/dev/null || true

echo "### Bước 5: reload nginx + bật certbot auto-renew..."
docker compose up -d
docker compose exec nginx nginx -s reload || docker compose restart nginx

echo ""
echo "### XONG! Truy cập: https://$DOMAIN"
