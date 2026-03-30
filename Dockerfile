# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime

# OCI metadata labels
LABEL org.opencontainers.image.title="TP-Link Omada MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for TP-Link Omada controller APIs"
LABEL org.opencontainers.image.authors="João Miguel Tabosa Vaz Marques Silva <joao@miguel.ms>"
LABEL org.opencontainers.image.url="https://github.com/MiguelTVMS/tplink-omada-mcp"
LABEL org.opencontainers.image.source="https://github.com/MiguelTVMS/tplink-omada-mcp"
LABEL org.opencontainers.image.documentation="https://github.com/MiguelTVMS/tplink-omada-mcp#readme"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]
