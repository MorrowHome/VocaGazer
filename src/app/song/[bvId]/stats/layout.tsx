import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

type Props = { params: { bvId: string }; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const bvId = decodeURIComponent(params.bvId);
  const song = await prisma.song.findUnique({
    where: { bvId },
    select: { title: true },
  });
  return { title: song ? `${song.title} · 数据` : '歌曲数据' };
}

export default function SongStatsLayout({ children }: Props) {
  return children;
}
