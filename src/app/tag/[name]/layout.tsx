import type { Metadata } from 'next';

type Props = { params: { name: string }; children: React.ReactNode };

export function generateMetadata({ params }: Props): Metadata {
  const name = decodeURIComponent(params.name);
  return {
    title: `#${name}`,
    description: `标签 ${name} 下的 VOCALOID 原创曲`,
  };
}

export default function TagLayout({ children }: Props) {
  return children;
}
