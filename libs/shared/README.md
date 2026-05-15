# KMS Shared Library - TypeScript

Shared utilities for KMS microservices.

## Installation

```bash
npm install @km/shared
```

## Usage

```typescript
import { success, failure, paginate, ApiError } from '@km/shared';

// Response helpers
app.get('/items', async (req, res) => {
  const items = await getItems();
  res.json(success(items));
});

// Pagination
const result = paginate(items, total, { page: 1, limit: 10 });

// Error handling
throw new NotFoundError('User');

// Async handler wrapper
app.get('/users', asyncHandler(async (req, res) => {
  const users = await userService.list();
  res.json(success(users));
}));
```

## API

### Response Helpers
- `success<T>(data: T, meta?)` - Create success response
- `failure(error: string, statusCode?)` - Create error response
- `created<T>(data: T)` - Create 201 response
- `noContent()` - Create 204 response

### Error Classes
- `ApiError` - Base error class
- `NotFoundError` - 404 error
- `UnauthorizedError` - 401 error
- `ForbiddenError` - 403 error
- `ValidationError` - 400 error

### Utilities
- `paginate(data, total, params)` - Paginate results
- `getEnv(key, default?)` - Get env var with validation
- `maskSensitiveData(obj, fields)` - Mask sensitive fields
- `generateId()` - Generate unique ID
- `sleep(ms)` - Promise-based sleep
- `retry(fn, options)` - Retry with backoff

### Middleware
- `errorHandler(err, req, res, next, logger)` - Express error handler
- `notFoundHandler(req, res)` - 404 handler
- `asyncHandler(fn)` - Wrap async route handlers