import type { Metadata } from 'next';
import './globals.css';
import { TRPCProvider } from '@/components/TRPCProvider';
import { AuthProvider } from '@/components/AuthContext';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ClickFireworks } from '@/components/ClickFireworks';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://morrowhome.site'),
  title: {
    default: 'VOCALOID Music Hub',
    template: '%s · VOCALOID Hub',
  },
  description: 'B 站 VOCALOID 原创曲排行',
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
