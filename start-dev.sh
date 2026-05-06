#!/bin/bash
# EduViet — Quick start development environment
set -e

echo "🚀 Starting EduViet development environment..."

# Load .env
if [ -f .env ]; then
  set -a && source .env && set +a
else
  echo "❌ .env not found. Copy .env.example → .env and fill in values."
  exit 1
fi

# Start Docker
echo "🐳 Starting Docker services..."
docker compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL ready"

# Migrations
echo "📦 Running database migrations..."
cd libs/prisma
npx prisma migrate deploy --schema=./schema.prisma
cd ../..

# Backend
echo "🔧 Starting backend (port ${API_PORT:-3000})..."
cd apps/backend && tsx src/main.ts > /tmp/eduviet-backend.log 2>&1 &
BACKEND_PID=$!
cd ../..
sleep 3

# Frontend
echo "🎨 Starting frontend (port 4200)..."
cd apps/frontend && npx ng serve --port 4200 --proxy-config proxy.conf.json > /tmp/eduviet-frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║     EduViet Dev Environment Ready!          ║"
echo "╠════════════════════════════════════════════╣"
echo "║ 🌐 Frontend:    http://localhost:4200        ║"
echo "║ 🔧 API:         http://localhost:3000        ║"
echo "║ 🗄️  pgAdmin:    http://localhost:5050        ║"
echo "║ 📦 MinIO:       http://localhost:9001        ║"
echo "║ 📧 Email:       http://localhost:8025        ║"
echo "╠════════════════════════════════════════════╣"
echo "║ pgAdmin login:  ${PGADMIN_DEFAULT_EMAIL}     ║"
echo "║ pgAdmin pass:   ${PGADMIN_DEFAULT_PASSWORD}  ║"
echo "╠════════════════════════════════════════════╣"
echo "║ Test accounts   (password: Admin@123)        ║"
echo "║  admin@eduviet.vn       → SUPER_ADMIN        ║"
echo "║  student@eduviet.vn     → STUDENT            ║"
echo "║  teacher@eduviet.vn     → SUBJECT_TEACHER    ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Logs: tail -f /tmp/eduviet-backend.log"
echo "Press Ctrl+C to stop all services"

trap "echo ''; echo '🛑 Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker compose down; echo 'Done'" SIGINT SIGTERM
wait
