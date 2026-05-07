#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# EduViet — Dev Start Script  (file duy nhất, bỏ start-dev.sh)
# Chạy: bash dev-start.sh
# Tự động: cài deps → khởi Docker → migrate DB → seed → start FE+BE
# ─────────────────────────────────────────────────────────────
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  EduViet — Dev Start${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ── 1. Kiểm tra pnpm ──────────────────────────────────────────
info "Kiểm tra pnpm..."
if ! command -v pnpm &>/dev/null; then
  warn "pnpm chưa có, đang cài..."
  npm install -g pnpm || error "Không thể cài pnpm. Hãy chạy: npm install -g pnpm"
fi
success "pnpm $(pnpm --version)"

# ── 2. Cài dependencies ───────────────────────────────────────
info "Cài dependencies..."
pnpm install
success "Dependencies OK"

# ── 3. Kiểm tra Docker ────────────────────────────────────────
info "Kiểm tra Docker..."
if ! command -v docker &>/dev/null; then
  error "Docker chưa cài. Tải tại: https://www.docker.com/products/docker-desktop"
fi
if ! docker info &>/dev/null; then
  warn "Docker daemon chưa chạy. Đang mở Docker Desktop..."
  open -a "Docker Desktop" 2>/dev/null || open -a "Docker" 2>/dev/null || true
  info "Chờ Docker khởi động (tối đa 60s)..."
  for i in {1..30}; do
    docker info &>/dev/null && break
    sleep 2
    printf "."
  done
  echo ""
  docker info &>/dev/null || error "Docker vẫn chưa sẵn sàng. Hãy mở Docker Desktop thủ công rồi chạy lại."
fi
success "Docker đang chạy"

# ── 4. Copy .env nếu chưa có ─────────────────────────────────
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    success "Đã tạo .env từ .env.example"
  else
    warn ".env không tồn tại và không có .env.example"
  fi
fi

# Load env vars để dùng trong banner
set -a && source .env 2>/dev/null || true && set +a

# ── 5. Khởi Docker Compose ────────────────────────────────────
info "Khởi động services (postgres, redis, minio, mailhog, pgadmin)..."
docker compose up -d
success "Docker Compose UP"

# ── 6. Đợi PostgreSQL sẵn sàng ───────────────────────────────
info "Đợi PostgreSQL sẵn sàng..."
for i in {1..30}; do
  docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-eduviet}" &>/dev/null && break
  sleep 2
  printf "."
done
echo ""
docker compose exec -T postgres pg_isready -U "${POSTGRES_USER:-eduviet}" &>/dev/null || {
  warn "PostgreSQL chưa response, thử tiếp 5 giây..."
  sleep 5
}
success "PostgreSQL OK"

# ── 7. Chạy Prisma migrations ─────────────────────────────────
info "Chạy database migrations..."
pnpm db:migrate 2>&1 | tail -5 || warn "Migration có lỗi, bỏ qua (có thể đã migrate rồi)"
success "Migrations OK"

# ── 8. Seed dữ liệu mẫu (chỉ lần đầu) ───────────────────────
SEED_FLAG="$ROOT/.seeded"
if [ ! -f "$SEED_FLAG" ]; then
  info "Seed dữ liệu mẫu (users, bài học)..."
  pnpm db:seed 2>&1 | tail -5 && touch "$SEED_FLAG" && success "Seed OK" || warn "Seed lỗi, bỏ qua"
else
  info "Đã seed rồi, bỏ qua"
fi

# ── 9. Banner URLs & credentials ─────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║         EduViet Dev Environment Ready!           ║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║${NC}  🌐  Frontend   →  http://localhost:4200          ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  🔧  API        →  http://localhost:3000          ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  🗄️   pgAdmin   →  http://localhost:5050          ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  📦  MinIO      →  http://localhost:9001          ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  📧  MailHog    →  http://localhost:8025          ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║${NC}  pgAdmin login: ${PGADMIN_DEFAULT_EMAIL:-admin@eduviet.vn}              ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}  pgAdmin pass:  ${PGADMIN_DEFAULT_PASSWORD:-PgAdmin@123}                    ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║${NC}  Test accounts  (password: Admin@123)            ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}    admin@eduviet.vn      →  SUPER_ADMIN           ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}    teacher@eduviet.vn    →  SUBJECT_TEACHER       ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}║${NC}    student@eduviet.vn    →  STUDENT               ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}╠══════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}${BOLD}║${NC}  Browser tự mở sau ~15s  •  Ctrl+C để dừng       ${GREEN}${BOLD}║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 10. Cleanup khi Ctrl+C ────────────────────────────────────
cleanup() {
  echo ""
  warn "Đang dừng dev servers..."
  kill $DEV_PID 2>/dev/null || true
  echo -e "${CYAN}Docker services vẫn chạy. Để dừng hẳn: pnpm docker:down${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── 11. Mở browser sau khi FE sẵn sàng ──────────────────────
(sleep 15 && open "http://localhost:4200" 2>/dev/null || true) &

# ── 12. Start FE + BE ─────────────────────────────────────────
pnpm dev &
DEV_PID=$!
wait $DEV_PID
