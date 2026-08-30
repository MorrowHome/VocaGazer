# 排行榜系统

## 概述

排行榜基于歌曲的**发布时间**进行过滤，按加权综合评分排序，生成各周期快照。

## 周期定义

| 周期 | 过滤规则（发布时间范围） | 快照更新频率 |
|------|------------------------|-------------|
| 日榜 (daily)    | 最近 1   天 | 每天 00:30 |
| 周榜 (weekly)   | 最近 7   天 | 每天 00:30 |
| 月榜 (monthly)  | 最近 30  天 | 每天 00:30 |
| 年榜 (yearly)   | 最近 365 天 | 每天 00:30 |
| 总榜 (alltime)  | 全部歌曲   | 每天 00:30 |

排行榜的"时效性"体现在：**只有发布在指定时间范围内的歌曲才会参与该周期的排名**。

## 评分算法

参考 SPEC.md 3.2 节定义的加权综合评分：

```
Score = P × 0.15 + L × 0.25 + C × 0.25 + F × 0.20 + Sh × 0.10 + T × 0.05
```

其中 P=播放量, L=点赞, C=投币, F=收藏, Sh=分享, T=评论。

## 架构

### 数据流

```
B站 API ──→ 采集(crawler.ts) ──→ Song 表
                                      │
                                      ▼
                              评分计算(scorer.ts)
                                      │
                                      ▼
                              快照生成(generator.ts)
                                      │
                                      ▼
                              Ranking 表(快照)
                                      │
                                      ▼
                              tRPC → 前端展示
```

### 关键文件

| 文件 | 职责 |
|------|------|
| `src/server/services/ranking/generator.ts` | 排行榜快照生成（定时任务） |
| `src/server/services/ranking/scorer.ts` | 评分算法 + 全量重算 |
| `src/server/trpc/routers/rankings.ts` | 排行榜查询 API（支持日期参数） |
| `src/app/ranking/page.tsx` | 排行榜前端页面 |
| `src/server/services/scheduler.ts` | 定时调度（每天 00:30 生成） |

### 数据库模型

`Ranking` 表存储快照（schema.prisma）：

```prisma
model Ranking {
  id        String   @id @default(cuid())
  songId    String
  song      Song     @relation(fields: [songId], references: [id], onDelete: Cascade)
  period    String   // 'daily' | 'weekly' | 'monthly' | 'yearly' | 'alltime'
  rank      Int
  score     Float
  date      DateTime  // 快照日期（每天一期）
  createdAt DateTime @default(now())

  @@index([period, date, rank])
}
```

每次生成时清空当日该周期的旧数据，重新插入 TOP 100。

## 历史排行浏览

排行榜页面提供日期选择器，支持查看历史快照：

1. 默认展示最新一期数据
2. 选择日期后查询该日期的快照
3. 总榜由于只有一个视角，不提供日期选择

## 生成方式

### 自动（定时任务）

scheduler.ts 配置每天 UTC 00:30 执行 `generateAllRankings()`：

```typescript
// 自动生成所有 5 个周期的排行榜
const result = await generateAllRankings();
// 返回: { daily: 8, weekly: 63, monthly: 100, yearly: 100, alltime: 100 }
```

### 手动

```bash
# 通过 API 触发
curl -H "x-cron-secret: 你的密钥" http://localhost:3000/api/crawl/trigger?type=ranking
```
