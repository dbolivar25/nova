/**
 * Executor Helper Functions
 *
 * Utilities for error handling, classification, and retries
 */

export interface ClassifiedError {
  type: 'validation' | 'rate_limit' | 'network' | 'unknown';
  message: string;
  retryAfterMs: number;
  originalError: Error;
}

/**
 * Convert unknown errors to Error objects
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error('Unknown error occurred');
}

/**
 * Classify errors for appropriate retry logic
 */
export function classifyError(error: unknown): ClassifiedError {
  const err = toError(error);
  const message = err.message.toLowerCase();

  // Rate limit errors
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('429')
  ) {
    // Extract retry-after if available
    const retryMatch = message.match(/retry.*?(\d+)/i);
    const retryAfterMs = retryMatch ? parseInt(retryMatch[1]) * 1000 : 5000;

    return {
      type: 'rate_limit',
      message: err.message,
      retryAfterMs,
      originalError: err,
    };
  }

  // Validation errors (BAML schema validation failures)
  if (
    message.includes('validation') ||
    message.includes('schema') ||
    message.includes('parse') ||
    message.includes('invalid') ||
    message.includes('failed to coerce')
  ) {
    return {
      type: 'validation',
      message: err.message,
      retryAfterMs: 0,
      originalError: err,
    };
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  ) {
    return {
      type: 'network',
      message: err.message,
      retryAfterMs: 1000,
      originalError: err,
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message: err.message,
    retryAfterMs: 0,
    originalError: err,
  };
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate unique ID for tracking
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ClassifiedError): boolean {
  return error.type === 'validation' || error.type === 'rate_limit';
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  const err = toError(error);
  return {
    message: err.message,
    name: err.name,
    stack: err.stack,
  };
}
