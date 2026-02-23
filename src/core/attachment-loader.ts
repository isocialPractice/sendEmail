/**
 * attachment-loader.ts
 * Resolves and merges attachment lists from email.js and global.js configs.
 * Resolves paths relative to the project root.
 */

import path from 'path';
import { existsSync } from 'fs';
import { exists } from '../utils/file-utils.js';
import { warn, debug } from '../utils/logger.js';
import type { Attachment, CLIAttachment, EngineConfig } from './types.js';

export class AttachmentLoader {
  constructor(private config: EngineConfig) {}

  /**
   * Resolve attachment paths relative to the project root.
   * Validates that files exist and logs warnings for missing ones.
   */
  resolveAttachments(attachments: Attachment[]): Attachment[] {
    return attachments.map(att => ({
      ...att,
      path: this.resolvePath(att.path),
    }));
  }

  /**
   * Validate that attachment files actually exist.
   * Returns list of missing file paths.
   */
  async validateAttachments(attachments: Attachment[]): Promise<string[]> {
    const missing: string[] = [];

    for (const att of attachments) {
      const resolvedPath = this.resolvePath(att.path);
      if (!(await exists(resolvedPath))) {
        missing.push(resolvedPath);
        warn(`Attachment not found: ${resolvedPath}`);
      } else {
        debug(`Attachment found: ${resolvedPath}`);
      }
    }

    return missing;
  }

  /**
   * Resolve attachment paths relative to a specific base directory.
   * Used by --global-config to resolve attachment paths relative to the
   * config file's own directory, regardless of CWD or rootPath.
   */
  resolveAttachmentsFromBase(attachments: Attachment[], basePath: string): Attachment[] {
    return attachments.map(att => ({
      ...att,
      path: path.isAbsolute(att.path) ? att.path : path.resolve(basePath, att.path),
    }));
  }

  /**
   * Merge email-specific attachments with global attachments.
   * Email attachments come first, then global.
   */
  merge(emailAttachments: Attachment[], globalAttachments: Attachment[]): Attachment[] {
    return [...emailAttachments, ...globalAttachments];
  }

  /**
   * Build attachments from CLI --attach-* options.
   * Pairs up --attach-file/--attach-path/--attach-cid/--attach-content-disp arguments.
   */
  buildFromCLI(cliArgs: {
    attachFile?: string[];
    attachPath?: string[];
    attachCid?: string[];
    attachContentDisp?: string[];
  }): Attachment[] {
    const { attachFile = [], attachPath = [], attachCid = [], attachContentDisp = [] } = cliArgs;

    const count = Math.max(attachFile.length, attachPath.length);
    if (count === 0) return [];

    const attachments: Attachment[] = [];

    for (let i = 0; i < count; i++) {
      const att: CLIAttachment = {
        filename: attachFile[i],
        path: attachPath[i],
        cid: attachCid[i],
        contentDisposition: (attachContentDisp[i] as 'attachment' | 'inline') ?? 'attachment',
      };

      if (!att.path) {
        warn(`Attachment at index ${i} has no --attach-path, skipping.`);
        continue;
      }

      const resolved: Attachment = {
        filename: att.filename ?? path.basename(att.path),
        path: this.resolvePath(att.path),
        ...(att.contentDisposition && { contentDisposition: att.contentDisposition }),
        ...(att.cid && { cid: att.cid }),
      };

      attachments.push(resolved);
    }

    return attachments;
  }

  /**
   * Resolve a path: if relative, prefer CWD (caller's working directory),
   * then fall back to the project root (attachments/ folder, etc.).
   */
  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) return filePath;

    const cwdPath = path.resolve(process.cwd(), filePath);
    if (existsSync(cwdPath)) return cwdPath;

    return path.resolve(this.config.rootPath, filePath);
  }
}
