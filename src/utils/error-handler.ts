/**
 * error-handler.ts
 * Centralized error handling, classification, and formatting.
 */

import { printError } from './logger.js';

export class SendEmailError extends Error {
  constructor(
    message: string,
    public readonly category: string,
    public readonly details?: string[],
    public readonly suggestion?: string
  ) {
    super(message);
    this.name = 'SendEmailError';
  }
}

export class ConfigurationError extends SendEmailError {
  constructor(message: string, details?: string[], suggestion?: string) {
    super(message, 'Configuration', details, suggestion);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends SendEmailError {
  constructor(message: string, details?: string[], suggestion?: string) {
    super(message, 'Validation', details, suggestion);
    this.name = 'ValidationError';
  }
}

export class FileError extends SendEmailError {
  constructor(message: string, details?: string[], suggestion?: string) {
    super(message, 'File', details, suggestion);
    this.name = 'FileError';
  }
}

export class NetworkError extends SendEmailError {
  constructor(message: string, details?: string[], suggestion?: string) {
    super(message, 'Network', details, suggestion);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends SendEmailError {
  constructor(message: string, details?: string[], suggestion?: string) {
    super(message, 'Authentication', details, suggestion);
    this.name = 'AuthenticationError';
  }
}

/**
 * Handle an error: print formatted output and optionally exit.
 */
export function handleError(err: unknown, exitProcess = true): void {
  if (err instanceof SendEmailError) {
    printError({
      category: err.category,
      message: err.message,
      details: err.details,
      suggestion: err.suggestion,
    }, exitProcess);
  } else if (err instanceof Error) {
    printError({
      category: 'Unexpected',
      message: err.message,
      details: [err.stack ?? ''],
      suggestion: 'If this error persists, please report it.',
    }, exitProcess);
  } else {
    printError({
      category: 'Unknown',
      message: String(err),
    }, exitProcess);
  }
}

/**
 * Wrap an async function to catch and handle errors gracefully.
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  exitOnError = true
): Promise<T | undefined> {
  return fn().catch(err => {
    handleError(err, exitOnError);
    return undefined;
  });
}
