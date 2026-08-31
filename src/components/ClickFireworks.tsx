'use client';

import { useEffect, useRef, useCallback } from 'react';
import { onSparkles } from '@/components/particleBus';
import { usePrefersReducedMotion } from '@/components/motion/usePrefersReducedMotion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const COLORS = [
  '#06B6D4', '#EC4899', '#A855F7', '#22D3EE',
  '#F97316', '#10B981', '#FBBF24', '#EF4444',
];

function burst(particles: Particle[], cx: number, cy: number, count: number) {
  const color1 = COLORS[Math.floor(Math.random() * COLORS.length)];
  const color2 = COLORS[Math.floor(Math.random() * COLORS.length)];
  const n = Math.min(count, 24);
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.3;
    const speed = 1.2 + Math.random() * 3;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 28 + Math.random() * 22,
      color: i % 2 === 0 ? color1 : color2,
      size: 1.5 + Math.random() * 2.5,
    });
  }
}

export function ClickFireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const reduce = usePrefersReducedMotion();

  const handleClick = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    burst(particlesRef.current, e.clientX - rect.left, e.clientY - rect.top, 48);
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
    const unsub = onSparkles((x, y, count) => burst(particlesRef.current, x, y, count));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.98;

        const progress = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - progress;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
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
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
}
