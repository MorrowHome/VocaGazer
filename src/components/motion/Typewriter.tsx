'use client';

import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export function Typewriter({
  text,
  className = '',
  msPerChar = 48,
}: {
  text: string;
  className?: string;
  msPerChar?: number;
}) {
  const reduce = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduce ? text : '');

  useEffect(() => {
    if (reduce) {
      setShown(text);
      return;
    }
    setShown('');
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, msPerChar);
    return () => clearInterval(t);
  }, [text, msPerChar, reduce]);

  return (
    <span className={className}>
      {shown}
      {!reduce && shown.length < text.length && (
        <span className="type-caret" aria-hidden="true">▍</span>
      )}
    </span>
  );
}
