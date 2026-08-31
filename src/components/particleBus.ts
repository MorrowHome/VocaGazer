type SparkleHandler = (x: number, y: number, count: number) => void;

const listeners = new Set<SparkleHandler>();

export function spawnSparkles(x: number, y: number, count = 8): void {
  listeners.forEach((fn) => fn(x, y, count));
}

export function onSparkles(handler: SparkleHandler): () => void {
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}
