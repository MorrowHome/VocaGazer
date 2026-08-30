import type { Metadata } from 'next';
import './globals.css';
import { TRPCProvider } from '@/components/TRPCProvider';
import { AuthProvider } from '@/components/AuthContext';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'VOCALOID Music Hub',
  description: '专注于 VOCALOID 原创曲目的数据收集、分析与展示平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <TRPCProvider>
          <AuthProvider>
            <BackgroundLayers />
            <ClickFireworks />
            <SiteHeader />
            <div className="pb-16 lg:pb-0 min-h-[calc(100vh-3.5rem)] flex flex-col">
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
