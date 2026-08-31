'use client';

import { cloneElement, useCallback, type KeyboardEvent, type ReactElement } from 'react';
import { spawnSparkles } from '@/components/particleBus';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

type InputEl = HTMLInputElement;

export function SparkleInput({
  children,
}: {
  children: ReactElement<{ onKeyDown?: (e: KeyboardEvent<InputEl>) => void }>;
}) {
  const reduce = usePrefersReducedMotion();
  const onKeyDown = useCallback(
    (e: KeyboardEvent<InputEl>) => {
      children.props.onKeyDown?.(e);
      if (reduce || e.key.length !== 1) return;
      const rect = e.currentTarget.getBoundingClientRect();
      spawnSparkles(rect.right - 12, rect.top + rect.height / 2, 6);
    },
    [children, reduce],
  );
  return cloneElement(children, { onKeyDown });
}
