# 部署指南

## 方案一：VPS 直接部署（推荐）

最直接的方式，适合有 Linux 基础的用户。

### 1. 买一台 VPS

推荐最低配置（足够跑这个项目）：

| 服务商 | 配置 | 价格 |
|--------|------|------|
| **Hetzner** | CX22 (2核, 4GB RAM, 40GB SSD) | €3.49/月 |
| **DigitalOcean** | Basic (1核, 1GB RAM, 25GB SSD) | $6/月 |
| **搬瓦工** | 最低配 CN2 | $50/年左右 |

系统选 **Ubuntu 24.04** 或 **Debian 12**。

### 2. 连接服务器

```bash
ssh root@你的服务器IP
```

### 3. 安装基础环境

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git

# 验证
node -v   # 应该 >= 20
npm -v
```

### 4. 部署项目

```bash
# 克隆项目
git clone <你的仓库地址> /opt/vocaloid-hub
cd /opt/vocaloid-hub

# 安装依赖
npm install

# 创建环境变量文件
nano .env
```

`.env` 文件内容（参考项目中的 `.env`）：

```env
DATABASE_URL="file:./prisma/dev.db"
ANTHROPIC_API_KEY="sk-你的DeepSeek密钥"
ANTHROPIC_BASE_URL="https://api.deepseek.com/anthropic"
AI_MODEL="deepseek-v4-flash"
JWT_SECRET="生成一个随机字符串"
```

```bash
# 初始化数据库
npx prisma db push

# 构建项目
npm run build

# 测试启动（按 Ctrl+C 停止）
npm start
```

### 5. 用 PM2 保持进程常驻（关键）

```bash
# 安装 pm2
npm install -g pm2

# 用 ecosystem 配置启动（自动先执行 prisma db push）
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vocaloid-hub',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: { NODE_ENV: 'production' },
  }]
};
EOF

# 启动前先初始化数据库
npx prisma db push

# 启动
pm2 start ecosystem.config.js

# 保存 pm2 配置，确保服务器重启后自动启动
pm2 save
pm2 startup

# 查看状态
pm2 status
pm2 logs vocaloid-hub
```

**开机自启**：`pm2 startup` 会提示你运行一条命令，按提示执行即可。

### 6. （可选）配置 Nginx 反向代理 + 域名

```bash
# 安装 nginx
apt install -y nginx

# 配置
nano /etc/nginx/sites-available/vocaloid-hub
```

配置文件内容：

```nginx
server {
    listen 80;
    server_name 你的域名.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # WebSocket 支持（tRPC 需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# 启用站点
ln -s /etc/nginx/sites-available/vocaloid-hub /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 7. SSL 证书（免费）

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d 你的域名.com
```

后续自动续期，无需手动操作。

### 8. 定时任务验证

项目内置了 node-cron 定时任务。PM2 确保进程不中断，cron 就会一直运行。日志里会看到：

```
[Scheduler] 定时任务已启动
  - 采集: 每 6 小时 (0/6/12/18 点)
  - 排行榜: 每天 0:30
  - AI 晚报: 每天 20:00
  - 里程碑扫描: 每小时
```

### 9. SQLite 数据库备份

```bash
# 简单备份脚本
cp /opt/vocaloid-hub/prisma/dev.db /opt/backups/dev-$(date +%Y%m%d).db

# 建议加个 cron 每天自动备份
crontab -e
# 添加这行（每天凌晨 3 点备份）：
0 3 * * * cp /opt/vocaloid-hub/prisma/dev.db /opt/backups/dev-$(date +\%Y\%m\%d).db
```

---

## 方案二：Docker 部署

### 1. Dockerfile

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM base AS build
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.js ./next.config.js
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npm start"]
```

### 2. docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data  # SQLite 数据持久化
    environment:
      - DATABASE_URL=file:./data/dev.db
    env_file:
      - .env
    restart: unless-stopped
```

### 3. 部署

```bash
docker compose up -d
```

---

## 方案三：Railway 部署

Railway 对有 Docker 的项目很方便，但 SQLite 不推荐。

### 步骤

1. 在 [Railway](https://railway.app/) 注册
2. 点 **New Project** → **Deploy from GitHub repo**
3. 选择你的仓库
4. 在 Variables 里添加环境变量（同 `.env` 内容）
5. 部署
6. 在项目 Settings → **Volumes** 添加一个 volume，挂载到 `/app/data`（确保 SQLite 数据不丢失）
7. 在项目 Variables 中设置 `DATABASE_URL=file:./data/dev.db`

> **缺点**：Railway 免费版有休眠机制，休眠时 node-cron 不运行。需要付费 $5+/月 才能不休眠。

---

## 核心提醒

| 事项 | 说明 |
|------|------|
| **.env 文件** | 首次部署后不要提交到 Git，服务器上单独创建 |
| **SQLite 文件** | `/opt/vocaloid-hub/prisma/dev.db` — 定期备份这个文件 |
| **PM2 开机自启** | `pm2 startup && pm2 save` |
| **端口** | Next.js 默认 3000，Nginx 监听 80/443 |
| **日志** | `pm2 logs vocaloid-hub` 查看实时日志 |
| **更新** | `git pull && npm install && npm run build && pm2 restart vocaloid-hub` |
