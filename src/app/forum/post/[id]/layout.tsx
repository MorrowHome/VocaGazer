import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

type Props = { params: { id: string }; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { title: true, content: true, isDeleted: true },
  });
  if (!post || post.isDeleted) return { title: '帖子未找到' };
  return {
    title: post.title,
    description: post.content.slice(0, 120),
  };
}

export default function ForumPostLayout({ children }: Props) {
  return children;
}
