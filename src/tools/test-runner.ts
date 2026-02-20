/**
 * test-runner.ts
 * Test framework runner for --test option.
 * Delegates to vitest for unit tests and can start the mock SMTP server.
 */

import path from 'path';
import { info, success, error as logError } from '../utils/logger.js';
import { exists } from '../utils/file-utils.js';

export class TestRunner {
  constructor(private rootPath: string) {}

  /**
   * Run tests via vitest.
   * @param unitTest - specific test name to run (or undefined for all tests)
   */
  async run(unitTest?: string): Promise<void> {
    const { execa } = await import('execa').catch(() => {
      throw new Error(
        'Test runner requires the execa package. Run: npm install execa --save-dev'
      );
    });

    const vitestPath = path.resolve(this.rootPath, 'node_modules', '.bin', 'vitest');

    if (!(await exists(vitestPath))) {
      logError('vitest not found. Run `npm install` first.');
      process.exit(1);
    }

    const args = ['run'];

    if (unitTest) {
      info(`Running unit test: ${unitTest}`);
      args.push('--reporter=verbose', `--testNamePattern=${unitTest}`);
    } else {
      info('Running all tests...');
      args.push('--reporter=verbose');
    }

    try {
      const result = await execa(vitestPath, args, {
        cwd: this.rootPath,
        stdio: 'inherit',
      });

      if (result.exitCode === 0) {
        success('All tests passed.');
      }
    } catch (err) {
      const error = err as { exitCode?: number };
      logError(`Tests failed (exit code: ${error.exitCode ?? 1})`);
      process.exit(error.exitCode ?? 1);
    }
  }
}
