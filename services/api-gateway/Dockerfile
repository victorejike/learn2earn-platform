FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g tsx

FROM base AS deps
COPY package.json ./
RUN npm install

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 4000
CMD ["tsx", "src/index.ts"]
