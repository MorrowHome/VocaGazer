/**
 * 单进程互斥：采集 / 刷新 / 排行 不要同时抢 1 vCPU。
 */

let heldBy: string | null = null;

export function isJobLocked(): boolean {
  return heldBy !== null;
}

export function currentJob(): string | null {
  return heldBy;
}

export async function withJobLock<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ ok: true; result: T } | { ok: false; reason: 'busy'; holder: string }> {
  if (heldBy) {
    console.log(`[JobLock] ${name} 跳过，当前持有: ${heldBy}`);
    return { ok: false, reason: 'busy', holder: heldBy };
  }
  heldBy = name;
  try {
    const result = await fn();
    return { ok: true, result };
  } finally {
    heldBy = null;
  }
}
