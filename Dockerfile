FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

# 拷贝源码和 wiki 数据
COPY src/ ./src/
COPY wiki/ ./wiki/
COPY static/ ./static/

# 构建
RUN npm run build

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
