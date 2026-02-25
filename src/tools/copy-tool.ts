/**
 * copy-tool.ts
 * Copies the sendEmail tool (or just config/support types) to another directory.
 * IMPORTANT: Excludes config/accounts/ (contains sensitive credentials).
 *
 * @example
 * ```bash
 * sendEmail --copy
 * ```
 * Copies the full tool into a new `sendEmail/` directory inside the current working directory.
 * Automatically runs setup to create `config/accounts/_default.js`.
 *
 * ```bash
 * sendEmail --copy /path/to/destination
 * ```
 * Copies the full tool to an explicit destination path.
 *
 * ```bash
 * sendEmail --copy:config /path/to/destination
 * ```
 * Copies only config/support types (config/emails, config/globals, attachments/, img/).
 * Copies .github/scripts/ temporarily, runs the OS-appropriate setup script to create
 * config/accounts/_default.js, then removes .github/ from the destination.
 */

import path from 'path';
import { copyDir, copyFile, exists } from '../utils/file-utils.js';
import { info, success, warn } from '../utils/logger.js';
import { FileError } from '../utils/error-handler.js';

// Top-level items to exclude when copying the full tool
const ROOT_EXCLUDES = [
  'node_modules',
  'dist',
  'docs',
  '.git',
  '.github',    // Excluded entirely; .github/scripts is copied manually below
  '.gitignore',
  '.backups',
  '.tmp',
  'tmpclaude*',
  '__sendEmail__*'
];

/**
 * Determine whether the current environment is Unix-like (bash available).
 * On Cygwin and MSYS/Git Bash, process.platform is 'win32' but bash is present
 * and OSTYPE is set to 'cygwin' or 'msys'.
 */
function isUnixLike(): boolean {
  if (process.platform !== 'win32') return true;
  const ostype = (process.env['OSTYPE'] ?? '').toLowerCase();
  return ostype.startsWith('cygwin') || ostype.startsWith('msys');
}

export class CopyTool {
  /**
   * Copy the sendEmail tool (or config/support types) from sourceRoot to destPath.
   *
   * @param sourceRoot - Absolute path to the sendEmail package root.
   * @param destPath   - Destination path to copy into.
   * @param mode       - 'tools' (default): copy full tool + run setup inline.
   *                     'config': copy config/support types, run OS setup script, remove .github/.
   */
  async copy(sourceRoot: string, destPath: string, mode: 'tools' | 'config' = 'tools'): Promise<void> {
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

    if (mode === 'config') {
      await this.copyConfig(sourceRoot, resolvedDest);
    } else {
      await this.copyTools(sourceRoot, resolvedDest);
    }
  }

  /**
   * Copy the full sendEmail tool.
   * Excludes .github/ from the main copy, then copies only .github/scripts/.
   * Runs setup inline to create config/accounts/_default.js.
   */
  private async copyTools(sourceRoot: string, resolvedDest: string): Promise<void> {
    info(`Copying sendEmail to: ${resolvedDest}`);
    warn(`Note: config/accounts/ is excluded (contains sensitive credentials).`);

    await copyDir(sourceRoot, resolvedDest, ROOT_EXCLUDES);

    // Remove accounts directory from destination if it was somehow copied
    const destAccountsPath = path.resolve(resolvedDest, 'config', 'accounts');
    if (await exists(destAccountsPath)) {
      const fs = await import('fs/promises');
      await fs.rm(destAccountsPath, { recursive: true, force: true });
    }

    // Copy .github/scripts/ only (exclude other .github subfolders)
    const srcScripts = path.join(sourceRoot, '.github', 'scripts');
    const destScripts = path.join(resolvedDest, '.github', 'scripts');
    if (await exists(srcScripts)) {
      await copyDir(srcScripts, destScripts);
    }

    // Run setup inline: create config/accounts/ and copy _default.js template
    await this.runSetupInline(sourceRoot, resolvedDest);

    success(`sendEmail copied to: ${resolvedDest}`);
    info(`Next steps:`);
    info(`  1. cd "${resolvedDest}"`);
    info(`  2. npm install`);
    info(`  3. Edit config/accounts/_default.js with your credentials`);
  }

  /**
   * Copy only config/support types for use as a local config override.
   * Copies: config/emails/, config/globals/, attachments/, img/
   * Temporarily copies .github/scripts/, runs the OS-appropriate setup script
   * to create config/accounts/_default.js, then removes .github/ from the destination.
   */
  private async copyConfig(sourceRoot: string, resolvedDest: string): Promise<void> {
    info(`Copying sendEmail config/support types to: ${resolvedDest}`);

    const configDirs: Array<[string, string]> = [
      [path.join(sourceRoot, 'config', 'emails'),   path.join(resolvedDest, 'config', 'emails')],
      [path.join(sourceRoot, 'config', 'globals'),  path.join(resolvedDest, 'config', 'globals')],
      [path.join(sourceRoot, 'attachments'),        path.join(resolvedDest, 'attachments')],
      [path.join(sourceRoot, 'img'),                path.join(resolvedDest, 'img')],
    ];

    for (const [src, dest] of configDirs) {
      if (await exists(src)) {
        await copyDir(src, dest);
      }
    }

    // Copy .github/scripts/ temporarily so setup can run
    const srcScripts = path.join(sourceRoot, '.github', 'scripts');
    const destGithub = path.join(resolvedDest, '.github');
    const destScripts = path.join(destGithub, 'scripts');
    if (await exists(srcScripts)) {
      await copyDir(srcScripts, destScripts);
    }

    // Run the OS-appropriate setup script to create config/accounts/_default.js
    await this.runSetupScript(resolvedDest);

    // Remove the temporary .github/ folder from destination
    if (await exists(destGithub)) {
      const fs = await import('fs/promises');
      await fs.rm(destGithub, { recursive: true, force: true });
    }

    success(`Config/support types copied to: ${resolvedDest}`);
    info(`This directory can be used as a local config override.`);
    info(`When sendEmail is invoked from a parent of this folder, these config`);
    info(`types will take precedence over the sendEmail root config.`);
  }

  /**
   * Run setup inline: create config/accounts/ directory and copy _default.js template.
   * Used by tools mode. Mirrors the behaviour of .github/scripts/setup.sh / setup.bat.
   */
  private async runSetupInline(sourceRoot: string, resolvedDest: string): Promise<void> {
    const fs = await import('fs/promises');
    const accountsDir = path.join(resolvedDest, 'config', 'accounts');
    const templateSrc = path.join(sourceRoot, '.github', 'scripts', 'accounts', '_default.js');
    const templateDest = path.join(accountsDir, '_default.js');

    await fs.mkdir(accountsDir, { recursive: true });

    if (await exists(templateSrc) && !(await exists(templateDest))) {
      await copyFile(templateSrc, templateDest);
      info(`Created config/accounts/_default.js from template.`);
    }
  }

  /**
   * Run the OS-appropriate .github/scripts/setup script from the destination directory.
   * - Unix / macOS / Cygwin / Git Bash → bash setup.sh
   * - Windows CMD (native)             → cmd /c setup.bat
   */
  private async runSetupScript(destPath: string): Promise<void> {
    const { spawn } = await import('child_process');

    const unix = isUnixLike();
    const scriptName = unix ? 'setup.sh' : 'setup.bat';
    const scriptPath = path.join(destPath, '.github', 'scripts', scriptName);

    if (!(await exists(scriptPath))) {
      info(`Setup script not found (${scriptName}), skipping.`);
      return;
    }

    info(`Running setup (${unix ? 'Unix' : 'Windows'}: ${scriptName})...`);

    await new Promise<void>((resolve, reject) => {
      const proc = unix
        ? spawn('bash', [scriptPath], { cwd: destPath, stdio: 'inherit' })
        : spawn('cmd', ['/c', scriptPath], { cwd: destPath, stdio: 'inherit' });

      proc.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Setup script exited with code ${code}`));
        }
      });
      proc.on('error', reject);
    });
  }
}
