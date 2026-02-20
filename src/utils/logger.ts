/**
 * logger.ts
 * Logging utilities with chalk-colored output.
 */

import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

let verbose = false;

/**
 * Enable or disable verbose (debug) logging.
 */
export function setVerbose(enabled: boolean): void {
  verbose = enabled;
}

/**
 * Log an informational message.
 */
export function info(message: string): void {
  console.log(chalk.blue('  ') + message);
}

/**
 * Log a success message.
 */
export function success(message: string): void {
  console.log(chalk.green('✓') + ' ' + message);
}

/**
 * Log a warning message.
 */
export function warn(message: string): void {
  console.warn(chalk.yellow('⚠') + ' ' + chalk.yellow(message));
}

/**
 * Log an error message.
 */
export function error(message: string): void {
  console.error(chalk.red('✗') + ' ' + chalk.red(message));
}

/**
 * Log a debug message (only shown in verbose mode).
 */
export function debug(message: string): void {
  if (verbose) {
    console.log(chalk.gray('[debug] ') + chalk.gray(message));
  }
}

/**
 * Log a section header.
 */
export function header(title: string): void {
  console.log();
  console.log(chalk.bold(title));
  console.log(chalk.gray('─'.repeat(Math.min(title.length, 60))));
}

/**
 * Format a structured error message per the project's error format:
 * [ERROR] Category: Descriptive message
 * Details: ...
 * Suggestion: ...
 */
export function formatError(opts: {
  category: string;
  message: string;
  details?: string[];
  suggestion?: string;
}): string {
  const lines: string[] = [
    chalk.red(`[ERROR] ${opts.category}: ${opts.message}`),
  ];

  if (opts.details && opts.details.length > 0) {
    lines.push('');
    lines.push('Details:');
    opts.details.forEach(d => lines.push(`  - ${d}`));
  }

  if (opts.suggestion) {
    lines.push('');
    lines.push('Suggestion:');
    opts.suggestion.split('\n').forEach(l => lines.push(`  ${l}`));
  }

  return lines.join('\n');
}

/**
 * Print a structured error and optionally exit.
 */
export function printError(opts: Parameters<typeof formatError>[0], exit = false): void {
  console.error(formatError(opts));
  if (exit) process.exit(1);
}
