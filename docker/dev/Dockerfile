FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY src/package.json ./package.json
COPY src/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile
