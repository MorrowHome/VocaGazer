import type { Metadata } from 'next';
import './globals.css';
import { TRPCProvider } from '@/components/TRPCProvider';
import { AuthProvider } from '@/components/AuthContext';
import { ThemeProvider } from '@/components/ThemeContext';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { RainGlass } from '@/components/RainGlass';
import { SceneSync } from '@/components/SceneSync';
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

const THEME_BOOT = `(function(){try{var t=localStorage.getItem('vg-theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){}})();`;
const SCENE_BOOT = `(function(){try{var s=sessionStorage.getItem('vg-scene');document.documentElement.dataset.scene=s||'/bg-default.jpg'}catch(e){document.documentElement.dataset.scene='/bg-default.jpg'}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: SCENE_BOOT }} />
      </head>
      <body className="antialiased font-sans">
        <ThemeProvider>
          <TRPCProvider>
            <AuthProvider>
              <BackgroundLayers />
              <SceneSync />
              <RainGlass />
              <ClickFireworks />
              <SiteHeader />
              <div className="relative z-10 pb-16 lg:pb-0 min-h-[calc(100vh-3.5rem)] flex flex-col">
                <div className="flex-1">{children}</div>
                <SiteFooter />
              </div>
            </AuthProvider>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
