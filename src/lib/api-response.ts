/**
 * Standardized API Response Utilities
 * Implements RFC 7807 Problem Details for HTTP APIs
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    statusCode: number;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard error codes
 */
export enum ErrorCode {
  // Client Errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Creates a successful API response
 */
export function successResponse<T>(data: T, requestId?: string): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...(requestId && { 'X-Request-ID': requestId }),
    },
  });
}

/**
 * Creates an error API response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>,
  requestId?: string
): Response {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      statusCode,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...(requestId && { 'X-Request-ID': requestId }),
    },
  });
}

/**
 * Common error response helpers
 */
export const ApiErrors = {
  badRequest: (message: string, details?: Record<string, unknown>, requestId?: string) =>
    errorResponse(ErrorCode.BAD_REQUEST, message, 400, details, requestId),

  unauthorized: (message = 'Unauthorized', details?: Record<string, unknown>, requestId?: string) =>
    errorResponse(ErrorCode.UNAUTHORIZED, message, 401, details, requestId),

  forbidden: (message = 'Forbidden', details?: Record<string, unknown>, requestId?: string) =>
    errorResponse(ErrorCode.FORBIDDEN, message, 403, details, requestId),

  notFound: (resource: string, requestId?: string) =>
    errorResponse(ErrorCode.NOT_FOUND, `${resource} not found`, 404, undefined, requestId),

  conflict: (message: string, details?: Record<string, unknown>, requestId?: string) =>
    errorResponse(ErrorCode.CONFLICT, message, 409, details, requestId),

  validationError: (errors: Record<string, string[]>, requestId?: string) =>
    errorResponse(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      422,
      { validationErrors: errors },
      requestId
    ),

  rateLimitExceeded: (retryAfter?: number, requestId?: string) =>
    errorResponse(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests',
      429,
      { retryAfter },
      requestId
    ),

  internalError: (message = 'Internal server error', requestId?: string) =>
    errorResponse(ErrorCode.INTERNAL_ERROR, message, 500, undefined, requestId),

  databaseError: (message = 'Database operation failed', requestId?: string) =>
    errorResponse(ErrorCode.DATABASE_ERROR, message, 500, undefined, requestId),

  externalServiceError: (service: string, requestId?: string) =>
    errorResponse(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service ${service} is unavailable`,
      503,
      undefined,
      requestId
    ),
};

/**
 * Generates a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates request body against schema
 */
export function validateRequest<T>(
  body: unknown,
  schema: {
    parse: (data: unknown) => T;
  }
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  try {
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error && typeof error === 'object' && 'errors' in error) {
      const errors = error.errors as Array<{ path: string[]; message: string }>;
      const validationErrors: Record<string, string[]> = {};

      errors.forEach((err) => {
        const field = err.path.join('.');
        if (!validationErrors[field]) {
          validationErrors[field] = [];
        }
        validationErrors[field].push(err.message);
      });

      return { success: false, errors: validationErrors };
    }

    return {
      success: false,
      errors: {
        _general: ['Invalid request format'],
      },
    };
  }
}

/**
 * Wraps API route handler with error handling
 */
export function withErrorHandling(
  handler: (req: Request, context?: Record<string, unknown>) => Promise<Response>
) {
  return async (req: Request, context?: Record<string, unknown>): Promise<Response> => {
    const requestId = generateRequestId();

    try {
      return await handler(req, { ...context, requestId });
    } catch (error) {
      console.error('[API Error]', {
        requestId,
        url: req.url,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check for known error types
      if (error && typeof error === 'object') {
        if ('code' in error && error.code === 'P2002') {
          // Prisma unique constraint violation
          return ApiErrors.conflict('Resource already exists', undefined, requestId);
        }

        if ('code' in error && error.code === 'P2025') {
          // Prisma record not found
          return ApiErrors.notFound('Resource', requestId);
        }
      }

      // Default to internal server error
      return ApiErrors.internalError(
        process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : 'Unknown error')
          : 'An unexpected error occurred',
        requestId
      );
    }
  };
}
