#!/bin/sh
# Script khởi tạo MinIO buckets sau khi server chạy
# Chạy 1 lần khi deploy lần đầu

set -e

MC="mc"
ALIAS="eduviet"
ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
ACCESS_KEY="${MINIO_ACCESS_KEY:-minioadmin}"
SECRET_KEY="${MINIO_SECRET_KEY:-minioadmin}"
BUCKET="${MINIO_BUCKET:-eduviet}"

echo "⏳ Đợi MinIO sẵn sàng..."
until $MC alias set $ALIAS "$ENDPOINT" "$ACCESS_KEY" "$SECRET_KEY" 2>/dev/null; do
  sleep 2
done

echo "✅ MinIO sẵn sàng"

# Tạo bucket chính
$MC mb --ignore-existing "$ALIAS/$BUCKET"
echo "📦 Bucket '$BUCKET' đã sẵn sàng"

# Đặt policy: public read cho thư mục public/
$MC anonymous set download "$ALIAS/$BUCKET/public"
echo "🌐 Public read cho $BUCKET/public/"

echo "🎉 MinIO khởi tạo hoàn tất"
