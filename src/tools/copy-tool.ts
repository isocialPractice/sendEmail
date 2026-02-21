/**
 * copy-tool.ts
 * Copies the sendEmail tool to another directory.
 * IMPORTANT: Excludes config/accounts/ (contains sensitive credentials).
 *
 * @example
 * ```bash
 * sendEmail --copy
 * ```
 * Copies the tool into a new `sendEmail/` directory inside the current working directory.
 *
 * ```bash
 * sendEmail --copy /path/to/destination
 * ```
 * Copies the tool to an explicit destination path.
 */

import path from 'path';
import { copyDir, exists } from '../utils/file-utils.js';
import { info, success, warn } from '../utils/logger.js';
import { FileError } from '../utils/error-handler.js';

// Directories and files to exclude when copying
const COPY_EXCLUDES = [
  'config/accounts',  // Contains sensitive credentials - NEVER copy
  'node_modules',
  'dist',
  'docs',
  '.git',
  '.backups',
  '.tmp',
  'tmpclaude*',
  '__sendEmail__*'
];

// Top-level items to exclude
const ROOT_EXCLUDES = [
  'node_modules',
  'dist',
  'docs',
  '.git',
  '.gitignore',
  '.backups',
  '.tmp',
  'tmpclaude*',
  '__sendEmail__*'
];

export class CopyTool {
  /**
   * Copy the sendEmail tool from sourceRoot to destPath.
   * Excludes config/accounts/ and other sensitive/generated directories.
   */
  async copy(sourceRoot: string, destPath: string): Promise<void> {
    const resolvedDest = path.resolve(destPath);

    if (!(await exists(sourceRoot))) {
      throw new FileError(
        `Source directory not found: ${sourceRoot}`,
        [`The sendEmail root path does not exist: ${sourceRoot}`]
      );
    }

    if (await exists(resolvedDest)) {
      throw new FileError(
        `Destination already exists: ${resolvedDest}`,
        [
          `Remove or rename the existing directory first:`,
          `  rm -rf "${resolvedDest}"`,
        ]
      );
    }

    info(`Copying sendEmail to: ${resolvedDest}`);
    warn(`Note: config/accounts/ is excluded (contains sensitive credentials).`);
    warn(`You will need to create your own config/accounts/_default.js after copying.`);

    await copyDir(sourceRoot, resolvedDest, ROOT_EXCLUDES);

    // Remove accounts directory from destination if it was copied
    const destAccountsPath = path.resolve(resolvedDest, 'config', 'accounts');
    if (await exists(destAccountsPath)) {
      const fs = await import('fs/promises');
      await fs.rm(destAccountsPath, { recursive: true, force: true });
      info(`Removed config/accounts/ from destination (sensitive credentials).`);
    }

    success(`sendEmail copied to: ${resolvedDest}`);
    info(`Next steps:`);
    info(`  1. cd "${resolvedDest}"`);
    info(`  2. npm install`);
    info(`  3. cp config/accounts/example.js config/accounts/_default.js`);
    info(`  4. Edit config/accounts/_default.js with your credentials`);
  }
}
