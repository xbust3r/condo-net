FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json ./package.json
RUN pnpm install
