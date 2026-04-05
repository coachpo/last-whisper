# Build stage
FROM node:20-alpine AS build

RUN apk add --no-cache libc6-compat && \
    corepack enable && \
    corepack prepare pnpm@10.30.1 --activate

WORKDIR /app

COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY last-whisper-frontend/package.json last-whisper-frontend/pnpm-lock.yaml ./last-whisper-frontend/

WORKDIR /app/last-whisper-frontend

RUN pnpm config set store-dir /tmp/.pnpm-cache

RUN --mount=type=cache,id=pnpm-deps,target=/tmp/.pnpm-cache \
    pnpm install --frozen-lockfile

COPY last-whisper-frontend/ ./

ARG VITE_DEBUG_LOGGING=false
ENV VITE_DEBUG_LOGGING=$VITE_DEBUG_LOGGING

RUN pnpm run build

# Production stage — serve static files with a lightweight server
FROM node:20-alpine AS runner

RUN npm install -g serve@14

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

WORKDIR /app

COPY --from=build --chown=appuser:appgroup /app/last-whisper-frontend/dist ./dist

USER appuser

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
