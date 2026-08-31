import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

type Props = { params: { bvId: string }; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const bvId = decodeURIComponent(params.bvId);
  const song = await prisma.song.findUnique({
    where: { bvId },
    select: { title: true, author: true, description: true },
  });
  if (!song) return { title: '歌曲未找到' };
  const desc = (song.description || `${song.author} 的 VOCALOID 原创曲`).slice(0, 120);
  return {
    title: song.title,
    description: desc,
    openGraph: { title: song.title, description: desc },
  };
}

export default function SongLayout({ children }: Props) {
  return children;
}
