FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm db:generate

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:deploy && pnpm db:seed && pnpm dev --hostname 0.0.0.0"]
