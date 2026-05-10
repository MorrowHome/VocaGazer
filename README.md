# VOCALOID Music Hub 🎀

虚拟歌手原创音乐数据平台 — 用可爱的方式记录每一首动人的 VOCALOID 原创音乐。

每日自动从 B 站采集 VOCALOID 原创曲目数据，通过评分系统生成排行榜，提供数据分析和社区论坛。

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 14 (App Router) + React 18 |
| 类型安全 API | tRPC v10 |
| 数据库 | SQLite (Prisma 5 ORM) |
| 样式 | Tailwind CSS + 自定义 kawaii 主题 |
| 认证 | JWT (jsonwebtoken) + bcryptjs |
| 定时任务 | node-cron |
| 字体 | M PLUS Rounded 1c |

## 功能

- **数据采集** — 每日定时从 B 站 API 抓取 VOCALOID 原创曲目
- **排行榜** — 日榜 / 周榜 / 月榜 / 总榜，基于加权评分算法
- **歌曲详情** — 播放量、点赞、投币、收藏等数据面板
- **特别推荐** — 编辑推荐 + 热门推荐 + 最新发布
- **数据分析** — 可视化图表，趋势分析
- **社区论坛** — 发帖、回帖、点赞、分类筛选
- **用户系统** — 注册 / 登录 / JWT 会话

## 本地启动

### 前置要求

- Node.js 18+
- npm

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npx prisma generate
npx prisma db push

# 3. 可选：采集歌曲数据
curl http://localhost:3000/api/crawl/trigger

# 4. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 即可访问。

### 其他命令

```bash
# 生产构建
npm run build

# 启动生产服务器
npm start

# 查看数据库
npx prisma studio

# 手动触发采集（需要服务运行中）
curl http://localhost:3000/api/crawl/trigger
```

## 项目结构

```
vocaloid-hub/
├── prisma/                  # Prisma Schema
├── src/
│   ├── app/                 # Next.js App Router 页面
│   │   ├── page.tsx         # 首页
│   │   ├── ranking/         # 排行榜
│   │   ├── recommend/       # 特别推荐
│   │   ├── analytics/       # 数据分析
│   │   ├── forum/           # 社区论坛
│   │   ├── song/[bvId]/     # 歌曲详情
│   │   ├── login/           # 登录
│   │   ├── register/        # 注册
│   │   └── about/           # 关于
│   ├── components/          # React 组件
│   │   ├── BackgroundLayers.tsx   # 背景层（渐变 + 星星）
│   │   ├── ClickFireworks.tsx     # 点击烟花特效
│   │   ├── TRPCProvider.tsx       # tRPC 客户端
│   │   └── AuthContext.tsx        # 用户认证上下文
│   ├── server/              # 服务端代码
│   │   ├── trpc/            # tRPC 路由
│   │   └── services/        # 业务逻辑（采集、评分等）
│   └── lib/                 # 工具函数
│       ├── trpc.ts          # tRPC 客户端工具
│       ├── auth.ts          # JWT 工具
│       ├── token-store.ts   # 客户端 token 管理
│       └── utils.ts         # 通用工具
└── package.json
```

## 配色主题

采用 kawaii 风格浅色主题：

| 色名 | 色值 | 用途 |
|------|------|------|
| 粉 | `#FF6B9D` | 主色调、按钮、强调 |
| 青 | `#39BEB9` | 次色调、排行榜 |
| 紫 | `#B388FF` | 强调色 |
| 黄 | `#F7C94C` | 星标、评分 |
| 背景 | `#FCFAFF` | 页面底色 |

## License

MIT
