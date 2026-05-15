export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

export interface RequestContext {
  requestId: string;
  userId?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages
  };
}

export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

export function maskSensitiveData(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const masked = { ...obj };
  for (const field of fields) {
    if (masked[field]) {
      masked[field] = '***';
    }
  }
  return masked;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; delayMs: number }
): Promise<T> {
  return fn().catch(async (err) => {
    if (options.maxAttempts <= 1) {
      throw err;
    }
    await sleep(options.delayMs);
    return retry(fn, { maxAttempts: options.maxAttempts - 1, delayMs: options.delayMs });
  });
}