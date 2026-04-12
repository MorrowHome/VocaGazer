# VOCALOID Music Hub - 规格文档

## 1. 项目概述

**项目名称**: VOCALOID Music Hub (暂定)

**项目类型**: 前后端分离的全栈 Web 应用

**核心功能摘要**:
一个专注于 VOCALOID 原创曲目的数据收集、分析与展示平台。每日自动从 B 站 API 抓取新发布的 VOCALOID 音乐，通过科学的评分系统生成排行榜，提供 AI 辅助数据分析，并设有用户社区论坛。

**目标用户**:
- VOCALOID 音乐爱好者
- VOCALOID 创作者
- 音乐研究人员
- 关注 VOCALOID 文化的普通用户

---

## 2. 技术栈

### 前端
- **框架**: Next.js 14 (App Router) + React 18
- **UI 组件库**: shadcn/ui (基于 Radix UI)
- **样式方案**: Tailwind CSS
- **图表库**: Recharts 或 Tremor
- **状态管理**: Zustand
- **类型安全**: tRPC (前后端类型共享)

### 后端
- **运行时**: Node.js 20+
- **API 层**: tRPC (类型安全的 API)
- **ORM**: Prisma (数据库操作)
- **数据库**: PostgreSQL (推荐) 或 Supabase (可选)
- **定时任务**: Vercel Cron / Supabase Edge Functions / node-cron
- **AI 集成**: Claude API / OpenAI API

### 基础设施
- **包管理**: pnpm
- **部署**: Vercel (推荐) / Railway / Docker + Docker Compose
- **反向代理**: Nginx (生产环境，如需自定义域名)

### 为什么这样选？（AI vibe-coding 友好）

| 原方案 | 新方案 | 理由 |
|--------|--------|------|
| Express.js + REST API | tRPC | 前后端类型自动共享，AI 生成代码无类型错位 |
| MongoDB + Mongoose | Prisma + PostgreSQL | Schema 即类型定义，迁移命令清晰，AI 生成准确度高 |
| node-cron (自管) | 平台级 Cron | 无需担心多容器重复执行，开箱即用 |
| Docker + Nginx | Vercel / Railway | 专注代码，infra 交给平台 |

> **核心原则**：减少样板代码，降低 AI 生成出错的可能性。tRPC + Prisma 的组合让 AI 可以一次生成前后端连通的代码。

---

## 3. 功能模块详细设计

### 3.1 数据采集模块 (Bilibili API 集成)

#### 初始标签列表（后续优化）

**核心标签**
```
VOCALOID, 虚拟歌手, 术力口, UTAU, VOICEVOX, CeVIO, SynthesizerV
```

**中文VOCALOID**
```
中文VOCALOID, 中文术力口, 中文虚拟歌手
```

**角色标签**
```
洛天依, 言和, 乐正绫, 星尘, 镜音铃, 镜音连, 初音未来, 巡音流歌,
GUMI, 弱音, 墨清弦, 乐正龙牙, 徵羽摩柯, 北大叔, 小白
```

**作品类型标签**
```
VOCALOID曲, VOCALOID中文曲, VOCALOID翻调, VOCALOID原曲
```

**注**: 标签列表由用户后续优化

#### 采集策略
- **频率**: 每日 00:05、12:05、18:05 执行三次增量采集
- **去重**: 基于 bv_id 作为唯一索引，避免重复入库
- **增量更新**: 已存在的视频仅更新播放数据
- **原创筛选**: 基于关键词过滤

#### 原创筛选规则

**排除关键词**（标题/描述含有以下词则过滤）：
```
榜单类: 周榜, 月榜, 日榜, 年榜, 排行, 排名, 传说曲, 人气曲, 殿堂曲, 金曲
教程类: 教程, 教学, 攻略, 入门, 入坑, 指北, 指南, 介绍, 讲解, 解说, 解析
翻译类: 翻译, 中译, 日文, 日语, 罗马音, 字幕, 中文词
翻唱类: 翻唱, 翻填, 翻作
其他类: remix, remaster, cover, 演唱会, 祭, 盘点, 合集, 合辑, 精选, 专辑, 手办, MAD, MMD, 3D, 建模, 动画, 手书
```

**原创关键词**（含有以下词则认定为原创）：
```
原创, 作曲, 编曲, 作词, VOCALOID原曲, 术力口原曲, 自制, 自制曲, 本家, 个人制作
```

**可能原创关键词**（含有以下格式特征也认定为原创）：
```
feat., ft., / (斜杠格式), - (横杠格式), 全角空格
```

#### 验证结果
- 测试标签: VOCALOID, 虚拟歌手, 术力口, 洛天依, 初音未来
- API 调用: `https://api.bilibili.com/x/web-interface/search/all` (无需登录)
- 采集结果: 89个视频中过滤出16个可能原创
- 视频详情API: 正常工作，可获取播放量、点赞、投币、收藏等数据

#### 采集字段
```typescript
interface Song {
  bvId: string;           // B站视频BV号
  title: string;          // 视频标题
  author: string;         // UP主名称
  publishTime: Date;     // 发布时间
  description: string;    // 视频描述
  statistics: {
    playCount: number;    // 播放量
    likes: number;        // 点赞数
    coins: number;        // 投币数
    favorites: number;    // 收藏数
    shares: number;       // 分享数
    comments: number;     // 评论数
  };
  duration: number;        // 视频时长（秒）
  tags: string[];         // 标签数组
  picUrl: string;         // 封面图URL
}
```

#### 采集策略
- **频率**: 每日 00:05、12:05、18:05 执行三次增量采集
- **去重**: 基于 bv_id 作为唯一索引，避免重复入库
- **增量更新**: 已存在的视频仅更新播放数据

### 3.2 评分系统

#### 评分公式
采用加权综合评分算法，考虑以下因素：

```
Score = (P × Wp) + (L × Wl) + (C × Wc) + (F × Wf) + (Sh × Wsh) + (T × Wt)

其中:
P = 播放量, Wp = 0.15
L = 点赞数, Wl = 0.25
C = 投币数, Wc = 0.25
F = 收藏数, Wf = 0.20
Sh = 分享数, Wsh = 0.10
T = 评论数, Wt = 0.05
```

#### 排行榜规则
- **日榜**: 当日 00:00 - 23:59 发布的歌曲，按当日数据进行评分
- **周榜**: 过去 7 天发布的数据汇总评分
- **月榜**: 过去 30 天发布的数据汇总评分
- **总榜**: 所有历史数据汇总评分

#### 排行榜数量
每个榜单显示前 100 名

### 3.3 前端页面结构

#### 页面列表
```
/                   - 首页：展示今日概览 + 实时更新的最新发布
/ranking            - 排行榜页面：可切换 日/周/月/总榜
/recommend          - 特别推荐页面：编辑精选 + AI 推荐
/analytics          - 数据分析页面：可视化图表 + AI 解读
/forum              - 论坛首页：帖子列表
/forum/[postId]     - 帖子详情页
/forum/new          - 发布新帖
/song/[bvId]        - 歌曲详情页
/about              - 关于页面
```

#### 首页设计
- **Hero Section**: 大标题 + 动态背景（VOCALOID 风格渐变）
- **今日概览卡片**: 今日新曲数、总播放量、热门标签
- **最新发布列表**: 实时滚动的最新 20 首歌曲
- **快捷入口**: 排行榜、推荐、论坛

### 3.4 AI 分析模块

#### 功能点
1. **每日数据摘要**: 自动生成当日新曲概况
2. **趋势分析**: 识别上升趋势的创作者/作品
3. **异常检测**: 发现数据突增/异常的歌曲
4. **评论情感分析**: 简单正负向判定

#### 实现方式
- 后端调用 Claude API 生成分析文本
- 缓存分析结果，避免重复调用
- 每日 20:00 自动生成当日报告

### 3.5 论坛模块

#### 帖子结构 (tRPC 类型)
```typescript
const postSchema = z.object({
  id: z.string(),
  title: z.string().min(2).max(100),
  content: z.string().min(10).max(10000),
  author: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().nullable(),
  }),
  type: z.enum(['review', 'recommend', 'discussion', 'question']),
  relatedSongs: z.array(z.string()).optional(),
  tags: z.array(z.string()),
  stats: z.object({
    views: z.number(),
    likes: z.number(),
    replies: z.number(),
  }),
  isPinned: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
```

#### 回复结构 (tRPC 类型)
```typescript
const replySchema = z.object({
  id: z.string(),
  postId: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    avatar: z.string().nullable(),
  }),
  content: z.string().min(1).max(5000),
  likes: z.number(),
  createdAt: z.date(),
});
```

#### 功能
- 发帖/回帖（需登录）
- 点赞帖子/回复
- 按类型/时间/热度筛选
- 搜索帖子标题和内容

### 3.6 用户系统

#### 用户角色
- **游客**: 可浏览所有公开内容
- **注册用户**: 可发帖、回帖、点赞
- **管理员**: 可置顶/删除帖子、管理歌曲数据

#### 用户字段 (Prisma Schema)
```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String   @unique
  passwordHash String
  avatar       String?
  role         String   @default("user") // 'user' | 'admin'
  createdAt    DateTime @default(now())
  lastLogin    DateTime?

  posts   Post[]
  replies Reply[]
}
```

---

## 4. 数据库设计 (PostgreSQL + Prisma)

### 表列表
1. `Song` - 歌曲数据
2. `SongDailyStats` - 歌曲每日统计数据（用于历史追踪）
3. `Ranking` - 排行榜快照
4. `Post` - 论坛帖子
5. `Reply` - 回帖
6. `User` - 用户
7. `AiReport` - AI 分析报告缓存
8. `Setting` - 系统设置

### Prisma Schema 示例
```prisma
model Song {
  id          String   @id @default(cuid())
  bvId        String   @unique
  title       String
  author      String
  description String?
  duration    Int?
  picUrl      String?
  tags        String[]
  publishTime DateTime
  score       Float    @default(0)
  statistics  Json     // { playCount, likes, coins, favorites, shares, comments }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  dailyStats  SongDailyStats[]
  rankings     Ranking[]

  @@index([publishTime])
  @@index([score])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  type      String   // 'review' | 'recommend' | 'discussion' | 'question'
  tags      String[]
  relatedSongs String[]
  views     Int      @default(0)
  likes     Int      @default(0)
  isPinned  Boolean  @default(false)
  isDeleted Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  replies   Reply[]

  @@index([type, createdAt])
  @@index([authorId])
}

model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String   @unique
  passwordHash String
  avatar       String?
  role         String   @default("user") // 'user' | 'admin'
  createdAt    DateTime @default(now())
  lastLogin    DateTime?

  posts   Post[]
  replies Reply[]
}
```

### 索引设计 (Prisma)
```prisma
@@index([publishTime])
@@index([score])
@@index([type, createdAt])
@@index([authorId])
```

---

## 5. API 设计 (tRPC)

> 使用 tRPC 实现类型安全的 API，前后端共享类型，无需手写 API 文档。

### 路由结构
```typescript
// 公开路由 (publicProcedure)
router({
  songs: {
    getLatest: publicProcedure.input(paginationSchema).query(...),
    getByBvId: publicProcedure.input(z.string()).query(...),
  },
  rankings: {
    get: publicProcedure.input(rankingPeriodSchema).query(...),
  },
  posts: {
    getLatest: publicProcedure.input(postFilterSchema).query(...),
    getById: publicProcedure.input(z.string()).query(...),
  },
  analytics: {
    getOverview: publicProcedure.query(...),
  },
})

// 需认证路由 (protectedProcedure)
router({
  posts: {
    create: protectedProcedure.input(createPostSchema).mutation(...),
    update: protectedProcedure.input(updatePostSchema).mutation(...),
    delete: protectedProcedure.input(z.string()).mutation(...),
    reply: protectedProcedure.input(replySchema).mutation(...),
    like: protectedProcedure.input(z.string()).mutation(...),
  },
  replies: {
    like: protectedProcedure.input(z.string()).mutation(...),
  },
})

// 管理员路由 (adminProcedure)
router({
  crawl: {
    trigger: adminProcedure.mutation(...),
  },
  songs: {
    delete: adminProcedure.input(z.string()).mutation(...),
  },
  posts: {
    pin: adminProcedure.input(z.string()).mutation(...),
  },
})
```

### 前端调用示例
```typescript
// 前后端类型自动共享，IDE 自动补全
const latestSongs = await trpc.songs.getLatest.query({ page: 1, limit: 20 });
const song = await trpc.songs.getByBvId.query('BV1xx411c7XZ');
```

### 公开 REST API (兼容 SEO)
如需为 SEO 提供公开端点，可额外暴露 REST API：
```
GET  /api/songs/latest          - 获取最新歌曲
GET  /api/songs/:bvId           - 获取歌曲详情
GET  /api/rankings              - 获取排行榜
GET  /api/posts                 - 获取帖子列表
GET  /api/posts/:id             - 获取帖子详情
GET  /api/analytics/overview    - 获取数据概览
```

---

## 6. 页面 UI/UX 设计方向

### 视觉风格
- **主题**: 赛博朋克 + 音乐节奏感
- **主色调**: 深紫 (#6B21A8) + 青色 (#06B6D4) + 粉色 (#EC4899)
- **背景**: 深色系，带有微妙的网格/线条动画
- **字体**: 思源黑体 (中文) + Inter (英文)

### 动效设计
- 页面切换: 淡入淡出 + 微小位移
- 数据加载: 骨架屏 (Skeleton)
- 排行榜更新: 数字滚动动画
- 图表: 渐入动画

### 响应式策略
- 桌面优先设计
- 平板: 两栏布局
- 手机: 单栏，底部导航栏

---

## 7. 项目目录结构

```
vocaloid-hub/
├── prisma/                     # Prisma Schema 和迁移
│   └── schema.prisma
├── src/
│   ├── server/                  # 服务端代码
│   │   ├── trpc/              # tRPC 路由
│   │   │   ├── routers/       # 各模块路由
│   │   │   │   ├── songs.ts
│   │   │   │   ├── posts.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── rankings.ts
│   │   │   │   └── analytics.ts
│   │   │   ├── context.ts     # tRPC 上下文
│   │   │   └── trpc.ts        # tRPC 初始化
│   │   ├── services/          # 业务逻辑
│   │   │   ├── bilibili/      # B站API服务
│   │   │   ├── crawler/       # 采集服务
│   │   │   ├── ranking/       # 排行榜服务
│   │   │   └── ai/            # AI服务
│   │   └── jobs/              # 定时任务
│   ├── components/             # React 组件 (shadcn/ui)
│   ├── app/                   # Next.js App Router 页面
│   │   ├── page.tsx           # 首页
│   │   ├── ranking/           # 排行榜
│   │   ├── song/[bvId]/       # 歌曲详情
│   │   ├── forum/             # 论坛
│   │   └── api/               # REST API (可选，SEO用)
│   ├── lib/                   # 工具函数
│   │   ├── prisma.ts         # Prisma 客户端
│   │   └── trpc.ts           # tRPC 客户端 (前端用)
│   └── stores/                # Zustand stores
├── scripts/                    # 脚本
├── docker/                    # Docker 配置
├── docs/                      # 文档
├── package.json
└── README.md
```

> **说明**: 使用 tRPC 后，后端服务与前端代码放在同一仓库，通过 monorepo 结构组织。部署到 Vercel 时，API 和前端自动统一。

---

## 8. 开发阶段规划

### Phase 0: 原型验证 ✅ 完成
- [x] 编写 B站 API 采集原型脚本
- [x] 验证标签搜索接口可行性
- [x] 验证数据解析和入库流程
- [x] 确定最终标签列表

**原型脚本输出**: `backend/scripts/crawler-test.js`

**验证结论**:
- B站搜索 API 可正常调用（无需登录）
- 过滤逻辑可有效区分原创曲和榜单/教程类内容
- 视频详情 API 正常工作
- 需要更多标签覆盖更多角色

### Phase 1: 基础架构搭建
- [ ] 初始化 Next.js 项目 (包含 tRPC + Prisma)
- [ ] 配置 PostgreSQL 数据库连接
- [ ] 编写 Prisma Schema，生成类型
- [ ] 实现基础 tRPC 路由
- [ ] 配置 Vercel 或 Docker 环境

### Phase 2: 数据采集
- [ ] 实现 B站 API 采集服务
- [ ] 配置定时任务
- [ ] 实现数据去重与更新逻辑
- [ ] 创建歌曲详情页面

### Phase 3: 排行榜系统
- [ ] 实现评分算法
- [ ] 开发排行榜 API
- [ ] 创建排行榜页面和图表组件

### Phase 4: 前端界面
- [ ] 开发首页
- [ ] 开发排行榜页面
- [ ] 开发歌曲详情页
- [ ] 开发推荐页面

### Phase 5: AI 模块
- [ ] 集成 Claude API
- [ ] 开发 AI 分析端点
- [ ] 创建数据分析页面

### Phase 6: 论坛系统
- [ ] 开发用户系统
- [ ] 实现论坛 CRUD
- [ ] 创建论坛页面

### Phase 7: 部署上线
- [ ] 完善 Docker 配置
- [ ] 配置 Nginx
- [ ] 域名和 SSL 配置

---

## 9. 待确认事项

以下问题可在后续阶段确认，当前优先完成原型验证：

1. **用户认证**: 是否需要第三方登录（QQ/微信/GitHub）？
2. **论坛权限**: 发帖是否需要邮箱验证？
3. **AI 服务**: 使用 Claude API 还是 OpenAI？是否有预算限制？
4. **数据保留**: 历史数据保留多长时间？
5. **是否需要移动端 App**?

---

## 10. 参考资料

### 核心框架
- [Next.js 14](https://nextjs.org/)
- [tRPC](https://trpc.io/) - 类型安全 API
- [Prisma](https://prisma.io/) - 数据库 ORM
- [shadcn/ui](https://ui.shadcn.com/)

### 数据库
- [PostgreSQL](https://www.postgresql.org/)
- [Supabase](https://supabase.com/) - 可选 Postgres即服务

### 部署
- [Vercel](https://vercel.com/)
- [Railway](https://railway.app/)
- [Docker](https://www.docker.com/)

### B站 API
- [Bilibili API 文档](https://github.com/SocialSisterYi/bilibiliAPI_Plus)
