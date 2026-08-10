# ---- build stage ----
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY app ./app

# ---- runtime stage ----
FROM node:20-slim
ENV NODE_ENV=production
WORKDIR /app

# Run as a non-root user.
RUN useradd -r -u 1001 appuser
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/app ./app
COPY package*.json ./

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:3000/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "app/server.js"]
