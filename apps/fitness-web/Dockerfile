FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run sync:flow && npm run test:flow && npm run typecheck && npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 10001 fitness && adduser -S -u 10001 -G fitness fitness
COPY --from=builder --chown=fitness:fitness /app/.next/standalone ./
COPY --from=builder --chown=fitness:fitness /app/.next/static ./.next/static
COPY --from=builder --chown=fitness:fitness /app/public ./public
USER fitness
EXPOSE 3000
CMD ["node", "server.js"]
