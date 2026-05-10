/**
 * 里程碑追踪服务
 * 检测歌曲达到特定播放量门槛，记录精确达成时间
 *
 * 增强功能：
 * - 对接近门槛的歌曲主动从 B 站获取最新播放数据（不依赖爬虫更新）
 * - 区分"接近中"和"已达成"状态
 * - 用于定时任务，每小时检查一次
 */

import { PrismaClient } from '@prisma/client';
import { getVideoDetail, delay } from '../bilibili/client';

let _prisma: PrismaClient | null = null;
function getPrisma() {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

/** 里程碑门槛 */
export const THRESHOLDS = [100000, 1000000, 10000000] as const;
export type Threshold = (typeof THRESHOLDS)[number];

/** 距离门槛的接近比例 */
const WATCH_THRESHOLD = 0.80;   // ≥80% 时开始关注
const FRESH_FETCH = 0.90;       // ≥90% 时主动从 B 站拉取最新数据
const FANATICAL_FETCH = 0.98;   // ≥98% 时高频检查

/**
 * 检查一首歌是否达到里程碑
 * 在爬虫保存歌曲后调用
 */
export async function checkSongMilestones(
  songId: string,
  playCount: number,
): Promise<void> {
  const prisma = getPrisma();

  for (const threshold of THRESHOLDS) {
    if (playCount >= threshold) {
      const existing = await prisma.songMilestone.findUnique({
        where: { songId_threshold: { songId, threshold } },
      });
      if (!existing) {
        await prisma.songMilestone.create({
          data: {
            songId,
            threshold,
            achievedAt: new Date(),
            playCount,
          },
        });
        console.log(`[Milestone] 🎉 Song ${songId} reached ${threshold} plays!`);
      }
    }
  }
}

/**
 * 从 B 站获取实时播放量
 */
async function fetchCurrentPlayCount(bvId: string): Promise<number | null> {
  const detail = await getVideoDetail(bvId);
  return detail?.statistics?.view ?? null;
}

function parseStats(statistics: string): Record<string, number> {
  try {
    return JSON.parse(statistics);
  } catch {
    return {};
  }
}

/**
 * 获取一首歌最接近的门槛和进度
 */
export function getClosestThresholds(playCount: number): Array<{
  threshold: number;
  progress: number; // 0-1 的进度
}> {
  return THRESHOLDS
    .filter((t) => playCount < t) // 只关心未达成的
    .map((t) => ({ threshold: t, progress: playCount / t }))
    .slice(0, 2); // 只返回最近的两个未达成门槛
}

/**
 * 全量扫描——检查接近里程碑的歌曲，主动拉取最新数据
 * 用于定时任务，每小时运行
 */
export async function scanMilestones(): Promise<{
  newMilestones: number;
  approachingCount: number;
  newlyApproaching: string[];
}> {
  const prisma = getPrisma();
  let newMilestones = 0;
  const newlyApproaching: string[] = [];

  // 采集去重
  const batchSize = 100;
  let cursor: string | undefined;

  while (true) {
    const songs = await prisma.song.findMany({
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    if (songs.length === 0) break;

    for (const song of songs) {
      const stats = parseStats(song.statistics);
      let playCount = stats.playCount || 0;

      // 跳过远低于门槛的歌曲
      if (playCount < THRESHOLDS[0] * WATCH_THRESHOLD) continue;

      // 检查每个未达成的门槛
      for (const threshold of THRESHOLDS) {
        if (playCount >= threshold) {
          // 已达标 → 检查是否已记录
          const existing = await prisma.songMilestone.findUnique({
            where: { songId_threshold: { songId: song.id, threshold } },
          });
          if (!existing) {
            await prisma.songMilestone.create({
              data: {
                songId: song.id,
                threshold,
                achievedAt: new Date(),
                playCount,
              },
            });
            newMilestones++;
            console.log(`[Milestone] ${song.title} 达到 ${threshold} 播放！(${playCount})`);
          }
          continue;
        }

        // 未达标但接近门槛 → 从 B 站拉取最新数据
        const progress = playCount / threshold;
        if (progress >= FRESH_FETCH && song.bvId) {
          const freshCount = await fetchCurrentPlayCount(song.bvId);
          await delay(300);

          if (freshCount !== null && freshCount !== playCount) {
            // 更新 DB 中的统计数据（不触发 upsert 整个歌曲）
            const freshStats = { ...stats, playCount: freshCount };
            await prisma.song.update({
              where: { id: song.id },
              data: { statistics: JSON.stringify(freshStats), score: song.score },
            });

            playCount = freshCount;

            if (freshCount >= threshold) {
              await prisma.songMilestone.create({
                data: {
                  songId: song.id,
                  threshold,
                  achievedAt: new Date(),
                  playCount: freshCount,
                },
              });
              newMilestones++;
              console.log(`[Milestone] ${song.title} 达到 ${threshold} 播放！（实时数据检测 ${freshCount}）`);
              continue;
            }

            // 记录首次进入接近区
            if (progress < 1 && freshCount / threshold >= FRESH_FETCH) {
              newlyApproaching.push(`${song.title} (${threshold.toLocaleString()} 的 ${Math.round(freshCount / threshold * 100)}%)`);
            }
          }
        }

        // 极接近门槛（≥98%）且首次进入此范围的标记
        if (progress >= FANATICAL_FETCH && progress < 1) {
          console.log(`[Milestone] ${song.title} 极接近 ${threshold} 播放！当前 ${playCount}`);
        }
      }
    }

    cursor = songs[songs.length - 1].id;
  }

  return {
    newMilestones,
    approachingCount: newlyApproaching.length,
    newlyApproaching,
  };
}

/**
 * 获取所有正在接近里程碑的歌曲列表
 */
export async function getApproachingSongs(prisma: PrismaClient): Promise<
  Array<{
    song: { id: string; title: string; author: string; bvId: string };
    threshold: number;
    progress: number;
    playCount: number;
  }>
> {
  const songs = await prisma.song.findMany({
    select: { id: true, title: true, author: true, bvId: true, statistics: true },
    orderBy: { id: 'asc' },
  });

  const results: Array<{
    song: { id: string; title: string; author: string; bvId: string };
    threshold: number;
    progress: number;
    playCount: number;
  }> = [];

  for (const song of songs) {
    const stats = parseStats(song.statistics);
    const playCount = stats.playCount || 0;

    // 检查是否已有已达成记录
    const achievedThresholds = await prisma.songMilestone.findMany({
      where: { songId: song.id },
      select: { threshold: true },
    });
    const achievedSet = new Set(achievedThresholds.map((m) => m.threshold));

    for (const threshold of THRESHOLDS) {
      if (achievedSet.has(threshold)) continue;
      if (playCount >= threshold) continue;

      const progress = playCount / threshold;
      if (progress >= WATCH_THRESHOLD) {
        results.push({
          song: {
            id: song.id,
            title: song.title,
            author: song.author || '未知',
            bvId: song.bvId,
          },
          threshold,
          progress,
          playCount,
        });
      }
    }
  }

  results.sort((a, b) => b.progress - a.progress);
  return results;
}
