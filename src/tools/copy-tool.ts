/**
 * copy-tool.ts
 * Copies the sendEmail tool to another directory.
 * IMPORTANT: Excludes config/accounts/ (contains sensitive credentials).
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
  '.git',
  '.backups',
  '.tmp',
];

// Top-level items to exclude
const ROOT_EXCLUDES = [
  'node_modules',
  'dist',
  '.git',
  '.gitignore',
  '.backups',
  '.tmp',
  'tmpclaude',
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
