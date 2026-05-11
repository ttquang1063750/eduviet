# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build Angular app
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

# Copy workspace manifests for layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/frontend/package.json apps/frontend/

# Install all deps (including Angular CLI)
RUN pnpm install --frozen-lockfile

# Copy frontend source
COPY apps/frontend/ apps/frontend/

# Build production bundle (outputs to apps/frontend/dist/)
RUN pnpm --filter @eduviet/frontend build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Serve with Nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom SPA nginx config
COPY docker/nginx/nginx.spa.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app
COPY --from=builder /app/apps/frontend/dist/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
