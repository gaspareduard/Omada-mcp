# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS runtime

# OCI metadata labels
LABEL org.opencontainers.image.title="Safe Omada MCP"
LABEL org.opencontainers.image.description="Security-focused MCP server for TP-Link Omada Open API workflows"
LABEL org.opencontainers.image.authors="Internal platform team"
LABEL org.opencontainers.image.url="https://github.com/AILivesInTerminal/Omada-mcp"
LABEL org.opencontainers.image.source="https://github.com/AILivesInTerminal/Omada-mcp"
LABEL org.opencontainers.image.documentation="https://github.com/AILivesInTerminal/Omada-mcp#readme"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system omada && useradd --system --gid omada --create-home omada
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=build /app/dist ./dist
USER omada
CMD ["node", "dist/index.js"]
