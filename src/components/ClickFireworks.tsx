'use client';

import { useEffect, useRef, useCallback } from 'react';
import { onSparkles } from '@/components/particleBus';
import { usePrefersReducedMotion } from '@/components/motion/usePrefersReducedMotion';

interface Petal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const COLORS = ['#FF8BB8', '#FFC2D7', '#39C5BB', '#E4C56A', '#B8A0FF'];

function burst(petals: Petal[], cx: number, cy: number, count: number) {
  const n = Math.min(count, 22);
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.4;
    const speed = 1.1 + Math.random() * 2.8;
    petals.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.18,
      life: 0,
      maxLife: 32 + Math.random() * 24,
      color: COLORS[i % COLORS.length],
      size: 4 + Math.random() * 5,
    });
  }
}

function drawPetal(ctx: CanvasRenderingContext2D, p: Petal, alpha: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  ctx.shadowBlur = 8;
  ctx.shadowColor = p.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, p.size * 0.55, p.size, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function ClickFireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal[]>([]);
  const rafRef = useRef<number>(0);
  const reduce = usePrefersReducedMotion();

  const handleClick = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    burst(petalsRef.current, e.clientX - rect.left, e.clientY - rect.top, 36);
  }, []);

  useEffect(() => {
    if (reduce) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('click', handleClick);
    const unsub = onSparkles((x, y, count) => burst(petalsRef.current, x, y, count));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const petals = petalsRef.current;

      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.life++;
        if (p.life >= p.maxLife) {
          petals.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045;
        p.vx *= 0.985;
        p.rot += p.vr;
        drawPetal(ctx, p, 1 - p.life / p.maxLife);
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('click', handleClick);
      unsub();
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleClick, reduce]);

  if (reduce) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[56]"
      aria-hidden="true"
    />
  );
}
