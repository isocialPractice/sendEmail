/**
 * config-loader.ts
 * Loads and validates configurations from the config/ directory.
 * Supports both legacy JS (export var transporter) and new-style (export const account) formats.
 */

import path from 'path';
import { readFile, exists, listDirs } from '../utils/file-utils.js';
import { ConfigurationError } from '../utils/error-handler.js';
import { debug } from '../utils/logger.js';
import type {
  AccountConfig,
  EmailConfig,
  EmailList,
  Attachment,
  EngineConfig,
} from './types.js';

export class ConfigLoader {
  constructor(private config: EngineConfig) {}

  /**
   * Load an account configuration by name.
   * Supports new-style { account: AccountConfig } and legacy { transporter: Transporter }.
   */
  async loadAccount(accountName: string): Promise<{
    accountConfig?: AccountConfig;
    transporter?: unknown;
  }> {
    const accountPath = path.resolve(
      this.config.accountsPath,
      `${accountName}.js`
    );

    if (!(await exists(accountPath))) {
      throw new ConfigurationError(
        `Account '${accountName}' not found`,
        [`Expected file: ${accountPath}`, `The account file must exist in config/accounts/`],
        `Create a default account configuration:\n` +
        `  cp config/accounts/example.js config/accounts/_default.js\n\n` +
        `Then edit _default.js with your email credentials.\n` +
        `For help: sendEmail -h`
      );
    }

    debug(`Loading account: ${accountPath}`);

    try {
      // Use dynamic import (file:// URL required on Windows)
      const fileUrl = 'file://' + accountPath.replace(/\\/g, '/');
      const module = await import(fileUrl) as Record<string, unknown>;

      if (module.account) {
        return { accountConfig: module.account as AccountConfig };
      } else if (module.transporter) {
        // Legacy format: exports a nodemailer transporter directly
        return { transporter: module.transporter };
      } else {
        throw new ConfigurationError(
          `Account '${accountName}' has invalid format`,
          [
            `File: ${accountPath}`,
            `Expected 'export const account = { ... }' or 'export const transporter = nodemailer.createTransport({ ... })'`,
          ]
        );
      }
    } catch (err) {
      if (err instanceof ConfigurationError) throw err;
      const error = err as Error;
      throw new ConfigurationError(
        `Failed to load account '${accountName}'`,
        [error.message],
        `Check the syntax of: ${accountPath}`
      );
    }
  }

  /**
   * Load email configuration from config/emails/<emailName>/email.json
   */
  async loadEmailConfig(emailName: string): Promise<EmailConfig> {
    const emailPath = path.resolve(
      this.config.emailsPath,
      emailName,
      'email.json'
    );

    if (!(await exists(emailPath))) {
      throw new ConfigurationError(
        `Email config '${emailName}' not found`,
        [`Expected file: ${emailPath}`],
        `Create an email configuration or check the --config-email value.\n` +
        `Available emails: ${(await this.listEmails()).join(', ')}`
      );
    }

    debug(`Loading email config: ${emailPath}`);

    try {
      const content = await readFile(emailPath);
      return JSON.parse(content) as EmailConfig;
    } catch (err) {
      const error = err as Error;
      throw new ConfigurationError(
        `Failed to parse email config '${emailName}'`,
        [error.message, `File: ${emailPath}`],
        `Check that the file is valid JSON.`
      );
    }
  }

  /**
   * Load email attachments from config/emails/<emailName>/email.js
   * Returns empty array if the file doesn't exist.
   */
  async loadEmailAttachments(emailName: string): Promise<Attachment[]> {
    const attachPath = path.resolve(
      this.config.emailsPath,
      emailName,
      'email.js'
    );

    if (!(await exists(attachPath))) {
      debug(`No email.js found for '${emailName}', skipping attachments`);
      return [];
    }

    debug(`Loading email attachments: ${attachPath}`);

    try {
      const fileUrl = 'file://' + attachPath.replace(/\\/g, '/');
      const module = await import(fileUrl) as Record<string, unknown>;
      return (module.emailAttachments as Attachment[]) ?? [];
    } catch (err) {
      const error = err as Error;
      throw new ConfigurationError(
        `Failed to load email attachments for '${emailName}'`,
        [error.message, `File: ${attachPath}`]
      );
    }
  }

  /**
   * Load global attachments from config/globals/<globalName>/global.js
   */
  async loadGlobalAttachments(globalName: string): Promise<Attachment[]> {
    const globalPath = path.resolve(
      this.config.globalsPath,
      globalName,
      'global.js'
    );

    if (!(await exists(globalPath))) {
      throw new ConfigurationError(
        `Global config '${globalName}' not found`,
        [`Expected file: ${globalPath}`]
      );
    }

    debug(`Loading global attachments: ${globalPath}`);

    try {
      const fileUrl = 'file://' + globalPath.replace(/\\/g, '/');
      const module = await import(fileUrl) as Record<string, unknown>;
      return (module.globalAttachments as Attachment[]) ?? [];
    } catch (err) {
      const error = err as Error;
      throw new ConfigurationError(
        `Failed to load global attachments '${globalName}'`,
        [error.message, `File: ${globalPath}`]
      );
    }
  }

  /**
   * Load an HTML file from config/emails/<emailName>/html/<fileName>
   */
  async loadEmailHtml(emailName: string, fileName: string): Promise<string> {
    const htmlPath = path.resolve(
      this.config.emailsPath,
      emailName,
      'html',
      `${fileName}.htm`
    );

    // Try .htm first, then .html
    const altPath = path.resolve(
      this.config.emailsPath,
      emailName,
      'html',
      `${fileName}.html`
    );

    const resolvedPath = (await exists(htmlPath)) ? htmlPath : altPath;

    if (!(await exists(resolvedPath))) {
      throw new ConfigurationError(
        `HTML file '${fileName}' not found for email '${emailName}'`,
        [`Tried: ${htmlPath}`, `Tried: ${altPath}`]
      );
    }

    return readFile(resolvedPath);
  }

  /**
   * Load an email list from lists/<listName>.json
   */
  async loadEmailList(listName: string): Promise<EmailList> {
    const listPath = path.resolve(this.config.listsPath, `${listName}.json`);

    if (!(await exists(listPath))) {
      throw new ConfigurationError(
        `Email list '${listName}' not found`,
        [`Expected file: ${listPath}`],
        `Create the list file, or use --new-list to generate one from tool files.`
      );
    }

    debug(`Loading email list: ${listPath}`);

    try {
      const content = await readFile(listPath);
      const data = JSON.parse(content) as EmailList;

      if (!data['email-list'] || !Array.isArray(data['email-list'])) {
        throw new Error(`Expected top-level key "email-list" to be an array`);
      }

      return data;
    } catch (err) {
      const error = err as Error;
      throw new ConfigurationError(
        `Failed to parse email list '${listName}'`,
        [error.message, `File: ${listPath}`]
      );
    }
  }

  /**
   * List available account names.
   */
  async listAccounts(): Promise<string[]> {
    try {
      const dirs = await import('fs/promises');
      const entries = await dirs.readdir(this.config.accountsPath, { withFileTypes: true });
      return entries
        .filter(e => e.isFile() && e.name.endsWith('.js'))
        .map(e => e.name.replace(/\.js$/, ''));
    } catch {
      return [];
    }
  }

  /**
   * List available configured email names.
   */
  async listEmails(): Promise<string[]> {
    try {
      return listDirs(this.config.emailsPath);
    } catch {
      return [];
    }
  }

  /**
   * List available global names.
   */
  async listGlobals(): Promise<string[]> {
    try {
      return listDirs(this.config.globalsPath);
    } catch {
      return [];
    }
  }

  /**
   * List available email list names.
   */
  async listEmailLists(): Promise<string[]> {
    try {
      const dirs = await import('fs/promises');
      const entries = await dirs.readdir(this.config.listsPath, { withFileTypes: true });
      return entries
        .filter(e => e.isFile() && e.name.endsWith('.json'))
        .map(e => e.name.replace(/\.json$/, ''));
    } catch {
      return [];
    }
  }
}
