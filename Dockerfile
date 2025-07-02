# Install dependencies only when needed
FROM node:18-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js app
RUN pnpm run build

# Production image, copy all necessary files and run the app
FROM node:18-alpine AS runner
WORKDIR /app
RUN corepack enable

ENV NODE_ENV=production

# Copy built app and node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["pnpm", "start"]
