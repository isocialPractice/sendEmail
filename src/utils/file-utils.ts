/**
 * file-utils.ts
 * File reading, writing, and path utility functions.
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Read a file's text content.
 * Throws a descriptive error if not found.
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Failed to read file '${filePath}': ${error.message}`);
  }
}

/**
 * Write content to a file, creating parent directories as needed.
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
}

/**
 * Check if a file or directory exists.
 */
export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List files in a directory matching a given extension.
 */
export async function listFiles(dirPath: string, ext?: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter(e => e.isFile() && (!ext || e.name.endsWith(ext)))
    .map(e => path.join(dirPath, e.name));
}

/**
 * List subdirectory names in a directory.
 */
export async function listDirs(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.filter(e => e.isDirectory()).map(e => e.name);
}

/**
 * Copy a file from source to destination, creating parent dirs.
 */
export async function copyFile(src: string, dest: string): Promise<void> {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

/**
 * Copy a directory recursively, with optional exclusion list.
 */
export async function copyDir(
  src: string,
  dest: string,
  exclude: string[] = []
): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, exclude);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

/**
 * Determine content type from file extension.
 */
export function getContentType(filePath: string): 'html' | 'text' | 'markdown' | 'unknown' {
  const ext = path.extname(filePath).toLowerCase();
  if (['.html', '.htm'].includes(ext)) return 'html';
  if (['.txt'].includes(ext)) return 'text';
  if (['.md', '.markdown'].includes(ext)) return 'markdown';
  return 'unknown';
}

/**
 * Resolve a path relative to a base directory.
 * If the path is already absolute, return as-is.
 */
export function resolvePath(basePath: string, relativePath: string): string {
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.resolve(basePath, relativePath);
}
