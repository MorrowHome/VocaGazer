import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

type Props = { params: { name: string }; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = decodeURIComponent(params.name);
  const count = await prisma.song.count({ where: { author: name } });
  return {
    title: name,
    description: count > 0 ? `${name} 在站内有 ${count} 首曲目` : `${name} 的作品页`,
  };
}

export default function AuthorLayout({ children }: Props) {
  return children;
}
