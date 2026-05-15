export interface CacheOptions {
  ttl: number;
  prefix: string;
}

export class InMemoryCache<T> {
  private cache = new Map<string, { value: T; expires: number }>();

  constructor(private defaultTtl = 300) {}

  set(key: string, value: T, ttl?: number): void {
    const expires = Date.now() + (ttl || this.defaultTtl) * 1000;
    this.cache.set(key, { value, expires });
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clean(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

export function buildCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}