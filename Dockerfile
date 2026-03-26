# 多阶段构建

# 阶段1：依赖安装
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制 package.json 和 lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 阶段2：构建
FROM node:22-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 构建
RUN pnpm build

# 阶段3：运行
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 创建非 root 用户
RUN addgroup --system --gid 1001 niuma
RUN adduser --system --uid 1001 niuma

# 复制必要文件
COPY --from=builder --chown=niuma:niuma /app/dist ./dist
COPY --from=builder --chown=niuma:niuma /app/package.json ./package.json
COPY --from=builder --chown=niuma:niuma /app/node_modules ./node_modules

# 切换用户
USER niuma

# 暴露端口（如果需要）
EXPOSE 3000

# 运行
CMD ["node", "dist/cli/index.js"]
