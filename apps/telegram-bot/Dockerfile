FROM oven/bun:1.3 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock* ./
COPY packages/types/package.json packages/types/
COPY packages/core/package.json packages/core/
COPY packages/workflows/package.json packages/workflows/
RUN bun install --frozen-lockfile

# Copy source
COPY packages/ packages/
COPY apps/telegram-bot/ apps/telegram-bot/

WORKDIR /app/apps/telegram-bot
CMD ["bun", "run", "src/main.ts"]
