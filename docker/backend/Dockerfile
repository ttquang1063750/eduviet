# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Install dependencies (layer-cached separately from source)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable

# Copy workspace manifests first so `pnpm install` layer is cached
# independently from source code changes
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared-types/package.json        packages/shared-types/
COPY packages/shared-constants/package.json    packages/shared-constants/
COPY packages/email-templates/package.json     packages/email-templates/
COPY libs/prisma/package.json                  libs/prisma/
COPY libs/redis/package.json                   libs/redis/
COPY libs/storage/package.json                 libs/storage/
COPY apps/backend/package.json                 apps/backend/

# Install production deps only.
# tsx is now a regular dependency (not devDep) so it's included here.
RUN pnpm install --frozen-lockfile --prod

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Non-root user for security
RUN addgroup -S eduviet && adduser -S eduviet -G eduviet

RUN corepack enable

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules           ./node_modules
COPY --from=deps /app/packages/shared-types/node_modules  ./packages/shared-types/node_modules 2>/dev/null || true
COPY --from=deps /app/apps/backend/node_modules           ./apps/backend/node_modules           2>/dev/null || true

# Copy workspace config (needed by pnpm symlink resolution at runtime)
COPY pnpm-workspace.yaml package.json ./

# Copy all workspace source packages (tsx loads them as TypeScript at runtime)
COPY packages/ packages/
COPY libs/     libs/

# Copy backend source and config
COPY apps/backend/src/        apps/backend/src/
COPY apps/backend/tsconfig.json apps/backend/
COPY apps/backend/package.json  apps/backend/

# Fix ownership
RUN chown -R eduviet:eduviet /app

USER eduviet

EXPOSE 3000

# Run Prisma migrations then start the server via tsx (TypeScript runtime).
# tsx resolves workspace TS packages (redis, email-templates) without
# requiring a separate compile step for each package.
CMD ["sh", "-c", \
  "pnpm --filter @eduviet/prisma migrate:deploy && \
   pnpm --filter @eduviet/backend start:prod"]
