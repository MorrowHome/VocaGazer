'use client';

import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export function SceneSync() {
  const { data } = trpc.picks.scene.useQuery(undefined, { staleTime: 60_000 });

  useEffect(() => {
    if (!data?.activeUrl) return;
    document.documentElement.dataset.scene = data.activeUrl;
    try {
      sessionStorage.setItem('vg-scene', data.activeUrl);
    } catch {
      /* ignore */
    }
  }, [data?.activeUrl]);

  return null;
}
