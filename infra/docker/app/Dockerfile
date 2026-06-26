FROM node:22-bookworm-slim AS builder

WORKDIR /app

ENV BENTIX_DATA_SOURCE=json
ENV NEXT_PUBLIC_API_BASE_URL=""

COPY package.json package-lock.json ./
RUN npm ci

COPY schema.prisma prisma.config.ts next.config.js ./
COPY app ./app
COPY frontend ./frontend
COPY lib ./lib
COPY server ./server
COPY scripts ./scripts
COPY data ./data

RUN npm run db:generate
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/app ./app
COPY --from=builder /app/frontend ./frontend
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/server ./server
COPY --from=builder /app/data ./data
COPY --from=builder /app/schema.prisma ./schema.prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000

CMD ["npm", "start"]
