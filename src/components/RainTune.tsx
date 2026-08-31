'use client';

import { useEffect, useState } from 'react';

export type RainTune = {
  followSeconds: number;
  spawnSeconds: number;
  otherSpawnSeconds: number;
  homeStart: number;
  homeSpan: number;
  homeMax: number;
  otherPages: number;
};

export const RAIN_TUNE_DEFAULTS: RainTune = {
  followSeconds: 2.2,
  spawnSeconds: 5,
  otherSpawnSeconds: 5,
  homeStart: 0.55,
  homeSpan: 1.2,
  homeMax: 0.52,
  otherPages: 0.58,
};

const KEY = 'vg-rain-tune';

function clampTune(partial: Partial<RainTune>): RainTune {
  const n = (v: unknown, fallback: number, min: number, max: number) => {
    const x = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
    return Math.min(max, Math.max(min, x));
  };
  const spawn = n(partial.spawnSeconds, RAIN_TUNE_DEFAULTS.spawnSeconds, 0.5, 12);
  return {
    followSeconds: n(partial.followSeconds, RAIN_TUNE_DEFAULTS.followSeconds, 0.2, 8),
    spawnSeconds: spawn,
    otherSpawnSeconds: n(partial.otherSpawnSeconds, spawn, 0.5, 12),
    homeStart: n(partial.homeStart, RAIN_TUNE_DEFAULTS.homeStart, 0, 2),
    homeSpan: n(partial.homeSpan, RAIN_TUNE_DEFAULTS.homeSpan, 0.2, 4),
    homeMax: n(partial.homeMax, RAIN_TUNE_DEFAULTS.homeMax, 0, 1),
    otherPages: n(partial.otherPages, RAIN_TUNE_DEFAULTS.otherPages, 0, 1),
  };
}

function readStored(): RainTune {
  if (typeof window === 'undefined') return { ...RAIN_TUNE_DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...RAIN_TUNE_DEFAULTS };
    return clampTune(JSON.parse(raw) as Partial<RainTune>);
  } catch {
    return { ...RAIN_TUNE_DEFAULTS };
  }
}

let live = readStored();
export let liveRainAmount = 0;

export function setLiveRainAmount(v: number) {
  liveRainAmount = v;
}

export function getRainTune() {
  return live;
}

export function setRainTune(next: RainTune) {
  live = clampTune(next);
  try {
    localStorage.setItem(KEY, JSON.stringify(live));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('vg-rain-tune'));
}

export function spawnSecondsNow() {
  return window.location.pathname === '/' ? live.spawnSeconds : live.otherSpawnSeconds;
}

export function rainTargetFromScroll() {
  const t = live;
  if (window.location.pathname !== '/') return t.otherPages;
  const h = Math.max(1, window.innerHeight);
  const origin = h * t.homeStart;
  if (window.scrollY + 0.5 < origin) return 0;
  const span = Math.max(1, h * t.homeSpan);
  const p = Math.min(1, Math.max(0, (window.scrollY - origin) / span));
  const s = p * p * (3 - 2 * p);
  const trickle = t.homeMax * 0.16;
  return trickle + (t.homeMax - trickle) * s;
}

const FIELDS: { key: keyof RainTune; label: string; min: number; max: number; step: number }[] = [
  { key: 'followSeconds', label: '跟上延迟（秒）', min: 0.2, max: 8, step: 0.1 },
  { key: 'spawnSeconds', label: '首页起雨时间（秒）', min: 0.5, max: 12, step: 0.1 },
  { key: 'otherSpawnSeconds', label: '其它页起雨时间（秒）', min: 0.5, max: 12, step: 0.1 },
  { key: 'homeStart', label: '开始下雨（屏高，0=欢迎页）', min: 0, max: 2, step: 0.05 },
  { key: 'homeSpan', label: '加满距离（屏高）', min: 0.2, max: 4, step: 0.05 },
  { key: 'homeMax', label: '首页最大雨量', min: 0, max: 1, step: 0.01 },
  { key: 'otherPages', label: '其它页雨量', min: 0, max: 1, step: 0.01 },
];

export function RainTunePanel() {
  const [open, setOpen] = useState(false);
  const [tune, setTune] = useState<RainTune>(RAIN_TUNE_DEFAULTS);
  const [now, setNow] = useState(0);

  useEffect(() => {
    const next = readStored();
    live = next;
    setTune(next);
    const sync = () => setTune({ ...getRainTune() });
    window.addEventListener('vg-rain-tune', sync);
    return () => window.removeEventListener('vg-rain-tune', sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      setNow(liveRainAmount);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const patch = (key: keyof RainTune, value: number) => {
    const next = { ...tune, [key]: value };
    setTune(next);
    setRainTune(next);
  };

  return (
    <div className="fixed bottom-20 right-3 z-[80] lg:bottom-4 pointer-events-auto text-[11px] font-sans">
      {open ? (
        <div className="w-56 rounded-2xl border border-white/20 bg-black/70 p-3 text-white shadow-xl backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-bold tracking-wider">雨量</p>
            <button type="button" className="text-white/60 hover:text-white" onClick={() => setOpen(false)}>
              收起
            </button>
          </div>
          <p className="mb-2 text-white/55">当前 {now.toFixed(2)}</p>
          {FIELDS.map((f) => (
            <label key={f.key} className="mb-2 block">
              <span className="mb-0.5 flex justify-between text-white/70">
                <span>{f.label}</span>
                <span>{tune[f.key].toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={tune[f.key]}
                onChange={(e) => patch(f.key, Number(e.target.value))}
                className="w-full accent-pink-400"
              />
            </label>
          ))}
          <button
            type="button"
            className="mt-1 w-full rounded-full border border-white/20 py-1 text-white/80 hover:bg-white/10"
            onClick={() => {
              setTune({ ...RAIN_TUNE_DEFAULTS });
              setRainTune({ ...RAIN_TUNE_DEFAULTS });
            }}
          >
            恢复默认
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="rounded-full border border-white/20 bg-black/60 px-3 py-1.5 font-bold tracking-wider text-white/90 backdrop-blur-md hover:bg-black/75"
          onClick={() => setOpen(true)}
        >
          雨量
        </button>
      )}
    </div>
  );
}
