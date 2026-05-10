/**
 * 里程碑追踪服务
 * 检测歌曲达到特定播放量门槛，记录精确达成时间
 */

import { PrismaClient } from '@prisma/client';

let _prisma: PrismaClient | null = null;
function getPrisma() {
  if (!_prisma) _prisma = new PrismaClient();
  return _prisma;
}

/** 里程碑门槛 */
export const THRESHOLDS = [100000, 1000000, 10000000] as const;
export type Threshold = (typeof THRESHOLDS)[number];

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
      // 检查是否已记录该门槛
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
 * 全量扫描——检查所有接近里程碑的歌曲
 * 用于定时任务，补充爬虫未覆盖到的歌曲
 */
export async function scanMilestones(): Promise<number> {
  const prisma = getPrisma();
  let newMilestones = 0;

  // 获取所有歌曲（分页避免内存爆炸）
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
      const playCount = stats.playCount || 0;

      // 至少达到最低门槛的 95% 才检查
      if (playCount < THRESHOLDS[0] * 0.95) continue;

      for (const threshold of THRESHOLDS) {
        if (playCount >= threshold) {
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
        }
      }
    }

    cursor = songs[songs.length - 1].id;
  }

  return newMilestones;
}

function parseStats(statistics: string): Record<string, number> {
  try {
    return JSON.parse(statistics);
  } catch {
    return {};
  }
}
