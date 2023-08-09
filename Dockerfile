FROM node:18-alpine AS deps
RUN apk add --no-cache build-base libc6-compat gcompat curl

WORKDIR /app
RUN npm install -g pnpm
ENV PNPM_HOME=/pnpm-test/.pnpm
ENV PATH=$PATH:$PNPM_HOME

COPY package.json pnpm-lock.yaml ./
RUN  pnpm install

FROM node:18-alpine AS builder
RUN apk add --no-cache build-base libc6-compat gcompat curl
WORKDIR /app
RUN npm install -g pnpm
ENV PNPM_HOME=/pnpm-test/.pnpm
ENV PATH=$PATH:$PNPM_HOME
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm run build

FROM node:18-alpine AS runner
RUN apk add --no-cache build-base libc6-compat gcompat curl
WORKDIR /app
RUN npm install -g pnpm
ENV PNPM_HOME=/pnpm-test/.pnpm
ENV PATH=$PATH:$PNPM_HOME

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["pnpm", "start"]
