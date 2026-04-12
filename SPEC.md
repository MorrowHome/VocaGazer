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
- **HTTP 客户端**: Fetch API / SWR

### 后端
- **运行时**: Node.js 20+
- **框架**: Express.js (或 Fastify)
- **数据库**: MongoDB + Mongoose ODM
- **定时任务**: node-cron
- **AI 集成**: Claude API / OpenAI API

### 基础设施
- **包管理**: pnpm
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx (生产环境)

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
```
- bv_id: B站视频BV号
- title: 视频标题
- author: UP主名称
- publish_time: 发布时间 (Unix timestamp)
- description: 视频描述
- statistics: {
    play_count: 播放量,
    likes: 点赞数,
    coins: 投币数,
    favorites: 收藏数,
    shares: 分享数,
    comments: 评论数
  }
- duration: 视频时长
- tags: 标签数组
- pic_url: 封面图URL
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

#### 帖子结构
```
- id: ObjectId
- title: string (2-100字符)
- content: string (富文本，10-10000字符)
- author: {
    id: ObjectId,
    name: string,
    avatar: string
  }
- type: 'review' | 'recommend' | 'discussion' | 'question'
- related_songs: [bvId] (关联歌曲，可选)
- tags: [string]
- stats: {
    views: number,
    likes: number,
    replies: number
  }
- created_at: Date
- updated_at: Date
- is_pinned: boolean
- is_deleted: boolean
```

#### 回复结构
```
- id: ObjectId
- post_id: ObjectId
- author: { id, name, avatar }
- content: string (1-5000字符)
- likes: number
- created_at: Date
- is_deleted: boolean
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

#### 用户字段
```
- id: ObjectId
- username: string (3-20字符，唯一)
- email: string (唯一)
- password_hash: string
- avatar: string (默认头像)
- role: 'user' | 'admin'
- created_at: Date
- last_login: Date
```

---

## 4. 数据库设计 (MongoDB)

### 集合列表
1. `songs` - 歌曲数据
2. `songs_daily_stats` - 歌曲每日统计数据（用于历史追踪）
3. `rankings` - 排行榜快照
4. `posts` - 论坛帖子
5. `replies` - 回帖
6. `users` - 用户
7. `ai_reports` - AI 分析报告缓存
8. `settings` - 系统设置

### 索引设计
```javascript
// songs 集合
{ bv_id: 1 }                    // 唯一索引
{ publish_time: 1 }
{ "statistics.play_count": -1 }
{ score: -1 }

// posts 集合
{ created_at: -1 }
{ type: 1, created_at: -1 }
{ author_id: 1 }

// replies 集合
{ post_id: 1, created_at: 1 }
```

---

## 5. API 设计

### 公开 API (无需认证)
```
GET  /api/songs/latest          - 获取最新歌曲 (分页)
GET  /api/songs/:bvId           - 获取歌曲详情
GET  /api/rankings              - 获取排行榜 (query: period=day|week|month|all)
GET  /api/posts                 - 获取帖子列表 (分页、筛选)
GET  /api/posts/:id             - 获取帖子详情
GET  /api/analytics/overview    - 获取数据概览
```

### 需认证 API
```
POST /api/posts                 - 创建帖子
PUT  /api/posts/:id             - 编辑帖子
DELETE /api/posts/:id           - 删除帖子
POST /api/posts/:id/reply       - 回复帖子
POST /api/posts/:id/like        - 点赞帖子
POST /api/replies/:id/like      - 点赞回复
```

### 管理员 API
```
POST /api/admin/crawl/trigger   - 手动触发采集
DELETE /api/admin/songs/:bvId   - 删除歌曲记录
PUT /api/admin/posts/:id/pin    - 置顶帖子
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
├── backend/                    # 后端项目
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器
│   │   ├── models/            # Mongoose 模型
│   │   ├── routes/            # 路由
│   │   ├── services/          # 业务逻辑
│   │   │   ├── bilibili/      # B站API服务
│   │   │   ├── crawler/       # 采集服务
│   │   │   ├── ranking/       # 排行榜服务
│   │   │   └── ai/            # AI服务
│   │   ├── middlewares/       # 中间件
│   │   ├── utils/             # 工具函数
│   │   └── app.js             # 入口文件
│   ├── scripts/               # 脚本
│   └── package.json
├── frontend/                   # 前端项目 (Next.js)
│   ├── app/                   # 页面
│   ├── components/            # 组件
│   ├── lib/                   # 工具函数
│   ├── stores/                # 状态管理
│   └── package.json
├── docker/                    # Docker 配置
├── docs/                      # 文档
└── README.md
```

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
- [ ] 初始化前后端项目
- [ ] 配置 MongoDB 连接
- [ ] 实现基础数据模型
- [ ] 配置 Docker 环境

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

- [Bilibili API 文档](https://github.com/SocialSisterYi/bilibiliAPI_Plus)
- [shadcn/ui 组件库](https://ui.shadcn.com/)
- [MongoDB 最佳实践](https://www.mongodb.com/docs/manual/core/schema-design/)
