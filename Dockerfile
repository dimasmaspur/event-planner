# --- build frontend ---
FROM node:22-bookworm-slim AS web
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# --- build server ---
FROM node:22-bookworm-slim AS server
WORKDIR /server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npm run build && npm prune --omit=dev

# --- runtime ---
FROM node:22-bookworm-slim
ENV NODE_ENV=production DATA_DIR=/data WEB_DIR=/app/web PORT=3000 HOST=0.0.0.0
WORKDIR /app/server
COPY --from=server /server/node_modules ./node_modules
COPY --from=server /server/dist ./dist
COPY --from=server /server/package.json ./
COPY --from=web /web/dist /app/web
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME /data
EXPOSE 3000
CMD ["node", "dist/index.js"]
