export interface HttpResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export function success<T>(data: T, meta?: Record<string, unknown>): HttpResponse<T> {
  return {
    success: true,
    data,
    ...(meta && { meta })
  };
}

export function failure(error: string, statusCode = 400): HttpResponse {
  return {
    success: false,
    error
  };
}

export function created<T>(data: T): HttpResponse<T> {
  return {
    success: true,
    data
  };
}

export function noContent(): HttpResponse {
  return {
    success: true
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}