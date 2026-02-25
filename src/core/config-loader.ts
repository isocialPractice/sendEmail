/**
 * config-loader.ts
 * Loads and validates configurations from the config/ directory.
 * Supports both legacy JS (export var transporter) and new-style (export const account) formats.
 */

import path from 'path';
import { readFile, exists, listDirs } from '../utils/file-utils.js';
import { ConfigurationError } from '../utils/error-handler.js';
import { debug, warn } from '../utils/logger.js';
import type {
  AccountConfig,
  EmailConfig,
  EmailList,
  Attachment,
  EngineConfig,
  GlobalDataResolution,
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
   * Supports nested paths, e.g. 'footer/billing' resolves to
   * config/globals/footer/billing/global.js.
   */
  async loadGlobalAttachments(globalName: string): Promise<Attachment[]> {
    // Build the folder path from potentially nested name ('footer/billing' → footer/billing/)
    const segments = globalName.split('/').filter(Boolean);
    const globalPath = path.resolve(this.config.globalsPath, ...segments, 'global.js');

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
   * Resolve the full structure of a global folder by name.
   * Supports nested paths like 'footer/billing' (→ config/globals/footer/billing/).
   *
   * Resolution order (mirrors --global-config default switch):
   *   1. CWD/config/globals/<name>/  — a -c, --copy instance in the current working directory
   *   2. ROOT/config/globals/<name>/ — the installed sendEmail root
   *   3. CWD/<name>/                 — a directory with that name relative to CWD
   *
   * The `assetBasePath` returned in `GlobalDataResolution` is set accordingly so
   * attachment paths declared in global.js are resolved from the correct root:
   *   - CWD   when found at step 1 or 3
   *   - ROOT  when found at step 2
   *
   * Data-file resolution rules:
   *   - html/ or data/ subfolder takes precedence (relaxed file naming)
   *   - Root-level HTML data file must be named html.htm or html.html (strict naming)
   *   - Root-level text data file must be named text.txt (strict naming)
   *
   * Nesting rules:
   *   - global.js is required for a folder to be treated as a global
   *   - Folders with global.js may contain html/ and data/ subfolders but not further global sub-folders
   */
  async resolveGlobalFolder(globalName: string): Promise<GlobalDataResolution> {
    const cwd = process.cwd();
    const segments = globalName.split('/').filter(Boolean);

    async function tryFolder(folderPath: string, assetBase: string): Promise<GlobalDataResolution | null> {
      if (!(await isDirectory(folderPath))) return null;

      const resolution: GlobalDataResolution = { name: globalName, folderPath, assetBasePath: assetBase };

      // Check for global.js configuration file
      const configFile = path.join(folderPath, 'global.js');
      if (await exists(configFile)) {
        resolution.configFilePath = configFile;
      }

      // HTML data: prefer html/ subfolder (relaxed naming), then root-level html.htm[l]
      const htmlFolder = path.join(folderPath, 'html');
      if (await isDirectory(htmlFolder)) {
        const fsp = await import('fs/promises');
        const files = (await fsp.readdir(htmlFolder)).filter(f => !f.startsWith('.'));
        if (files.length > 0) {
          resolution.htmlDataPath = path.join(htmlFolder, files[0]);
          resolution.htmlDataType = 'global:data:folder:html';
        }
      } else {
        const htmlHtm = path.join(folderPath, 'html.htm');
        const htmlHtml = path.join(folderPath, 'html.html');
        if (await exists(htmlHtm)) {
          resolution.htmlDataPath = htmlHtm;
          resolution.htmlDataType = 'global:data:html';
        } else if (await exists(htmlHtml)) {
          resolution.htmlDataPath = htmlHtml;
          resolution.htmlDataType = 'global:data:html';
        }
      }

      // Text data: prefer data/ subfolder (relaxed naming), then root-level text.txt
      const dataFolder = path.join(folderPath, 'data');
      if (await isDirectory(dataFolder)) {
        const fsp = await import('fs/promises');
        const files = (await fsp.readdir(dataFolder)).filter(f => !f.startsWith('.'));
        if (files.length > 0) {
          resolution.textDataPath = path.join(dataFolder, files[0]);
          resolution.textDataType = 'global:data:folder:data';
        }
      } else {
        const textTxt = path.join(folderPath, 'text.txt');
        if (await exists(textTxt)) {
          resolution.textDataPath = textTxt;
          resolution.textDataType = 'global:data:text';
        }
      }

      return resolution;
    }

    // Step 1: CWD/config/globals/<name>/ — check for a --copy instance first
    const cwdGlobalDir = path.join(cwd, 'config', 'globals', ...segments);
    const step1 = await tryFolder(cwdGlobalDir, cwd);
    if (step1) {
      debug(`Resolved inline global '${globalName}' from CWD copy-location: ${cwdGlobalDir}`);
      return step1;
    }

    // Step 2: ROOT/config/globals/<name>/ — sendEmail installed root
    const rootGlobalDir = path.join(this.config.rootPath, 'config', 'globals', ...segments);
    const step2 = await tryFolder(rootGlobalDir, this.config.rootPath);
    if (step2) {
      debug(`Resolved inline global '${globalName}' from root: ${rootGlobalDir}`);
      return step2;
    }

    // Step 3: CWD/<name>/ — a plain directory relative to CWD
    const cwdDir = path.resolve(cwd, ...segments);
    const step3 = await tryFolder(cwdDir, cwd);
    if (step3) {
      debug(`Resolved inline global '${globalName}' from CWD directory: ${cwdDir}`);
      return step3;
    }

    throw new ConfigurationError(
      `Global folder '${globalName}' not found`,
      [
        `Checked: ${cwdGlobalDir} (CWD copy-location)`,
        `Checked: ${rootGlobalDir} (sendEmail root)`,
        `Checked: ${cwdDir} (CWD directory)`,
      ],
      `Ensure the global folder exists in config/globals/ and contains a global.js file.`
    );
  }

  /**
   * Load a global's inline content (HTML and/or text) and its attachments.
   * Used when processing {% global 'name' %} tags inside email HTML templates.
   *
   * Attachment paths are returned raw (not resolved). The caller must call
   * `AttachmentLoader.resolveAttachmentsFromBase(attachments, assetBasePath)`
   * using the returned `assetBasePath` so that paths in global.js (e.g. 'img/logo.jpg')
   * are resolved relative to the correct root:
   *   - CWD   when the global was found in a --copy instance or a CWD directory
   *   - ROOT  when the global was found in the installed sendEmail root
   *
   * @param globalName  Name or nested path, e.g. 'footer' or 'footer/billing'
   * @returns Resolved HTML content, text content, raw attachment list, and asset base path
   */
  async loadGlobalForInline(globalName: string): Promise<{
    html?: string;
    text?: string;
    attachments: Attachment[];
    assetBasePath: string;
  }> {
    const resolution = await this.resolveGlobalFolder(globalName);

    // Attachments from global.js — returned raw, caller resolves paths via assetBasePath
    let attachments: Attachment[] = [];
    if (resolution.configFilePath) {
      try {
        const fileUrl = 'file://' + resolution.configFilePath.replace(/\\/g, '/');
        const module = await import(fileUrl) as Record<string, unknown>;
        attachments = (module.globalAttachments as Attachment[]) ?? [];
      } catch (err) {
        const error = err as Error;
        warn(`Failed to load attachments for global '${globalName}': ${error.message}`);
      }
    }

    // Load HTML data content
    let html: string | undefined;
    if (resolution.htmlDataPath) {
      try {
        html = await readFile(resolution.htmlDataPath);
        debug(`Loaded global HTML data: ${resolution.htmlDataPath}`);
      } catch (err) {
        const error = err as Error;
        warn(`Failed to load HTML data for global '${globalName}': ${error.message}`);
      }
    }

    // Load text data content
    let text: string | undefined;
    if (resolution.textDataPath) {
      try {
        text = await readFile(resolution.textDataPath);
        debug(`Loaded global text data: ${resolution.textDataPath}`);
      } catch (err) {
        const error = err as Error;
        warn(`Failed to load text data for global '${globalName}': ${error.message}`);
      }
    }

    return { html, text, attachments, assetBasePath: resolution.assetBasePath };
  }

  /**
   * Load global attachments from an explicit resolved file path.
   * Unlike loadGlobalAttachments(), path resolution is done by the caller.
   * Attachment paths are NOT resolved here — the caller handles that.
   */
  async loadGlobalAttachmentsFromFile(configFilePath: string): Promise<Attachment[]> {
    if (!(await exists(configFilePath))) {
      throw new ConfigurationError(
        `Global config file not found`,
        [`Expected file: ${configFilePath}`]
      );
    }

    debug(`Loading global attachments from file: ${configFilePath}`);

    try {
      const fileUrl = 'file://' + configFilePath.replace(/\\/g, '/');
      const module = await import(fileUrl) as Record<string, unknown>;
      return (module.globalAttachments as Attachment[]) ?? [];
    } catch (err) {
      const error = err as Error;
      throw new ConfigurationError(
        `Failed to load global attachments`,
        [error.message, `File: ${configFilePath}`]
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

// ─── Module-level helpers ─────────────────────────────────────────────────────

/**
 * Returns true if the given path is an existing directory.
 */
async function isDirectory(p: string): Promise<boolean> {
  try {
    const fsp = await import('fs/promises');
    return (await fsp.stat(p)).isDirectory();
  } catch {
    return false;
  }
}
