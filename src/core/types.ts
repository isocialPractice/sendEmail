/**
 * types.ts
 * All TypeScript interfaces and types for the sendEmail engine.
 */

/**
 * Email sending modes
 */
export enum SendMode {
  RAW = 'raw',             // Quick raw text email (-t, --text)
  NORMAL = 'normal',       // Structured email with options (--send-to, --subject, etc.)
  REPETITIVE = 'repetitive' // Bulk send to email lists (--config-email + --email-list)
}

/**
 * Account configuration exported from config/accounts/*.js
 * New-style format: export const account = { ... }
 */
export interface AccountConfig {
  service?: string;         // 'gmail', 'outlook', etc.
  host?: string;            // Custom SMTP host
  port?: number;            // Custom SMTP port (default: 587)
  secure?: boolean;         // true = port 465 (TLS), false = STARTTLS
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * Email attachment configuration
 * Used in config/emails/email.js and config/globals/global.js
 */
export interface Attachment {
  filename: string;
  path: string;
  contentDisposition?: 'attachment' | 'inline';
  cid?: string;             // Content ID for inline images: <img src="cid:logo@example.com">
}

/**
 * Email configuration loaded from config/emails/email.json
 */
export interface EmailConfig {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;             // Account name (e.g., "_default") or email address
  replyTo?: string | string[];
  subject?: string;
  html?: string | string[];  // HTML file reference(s) relative to email's html/ folder
  text?: string;             // Text file reference
  attachments?: string | Attachment[];  // String key name from email.js, OR pre-loaded array
  globals?: string[];        // Global template names to include (e.g., ["footer"])
  dsn?: DsnConfig;
  sendAll?: boolean;         // Send one email to all contacts on the list at once
  emailList?: string;        // List file name from lists/ (e.g., "billing")
  'email-list'?: EmailContact[];  // Inline contact list embedded in email.json
  log?: boolean | string;    // Log sent email to logs/ (true | "true" | false)
}

/**
 * Delivery Status Notification configuration
 */
export interface DsnConfig {
  id: string;
  return: 'headers' | 'full';
  notify: Array<'success' | 'failure' | 'delay'>;
  recipient: string;
}

/**
 * Email list contact entry from lists/*.json
 */
export interface EmailContact {
  email: string;              // REQUIRED
  name: string;               // REQUIRED
  [key: string]: string | number | boolean | undefined; // Additional optional fields
}

/**
 * Email list structure (lists/*.json)
 */
export interface EmailList {
  'email-list': EmailContact[];
}

/**
 * Template variables for substitution in email content
 */
export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

/**
 * Fully resolved email message ready for nodemailer (nodemailer-compatible)
 */
export interface EmailMessage {
  from: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Attachment[];
  dsn?: {
    id: string;
    return: string;
    notify: string[];
    recipient: string;
  };
}

/**
 * CLI options parsed from command-line arguments
 */
export interface CLIOptions {
  // Account & Config
  account?: string;              // --account [name]
  configEmail?: string;          // --config-email [name]

  // Sending Options
  sendTo?: string | string[];    // --send-to [address]
  subject?: string;              // --subject [text]
  messageFile?: string;          // --message-file [path]
  messageHtml?: string | true;   // --message-html [path] (true = flag-only, no argument)
  messageText?: string;          // --message-text [path]
  fromAddress?: string;          // --from-address [email]
  replyTo?: string | string[];   // --reply-to [email]
  cc?: string | string[];        // --cc [address]
  bcc?: string | string[];       // --bcc [address]

  // Attachment Options
  attachFile?: string[];         // --attach-file [filename] (repeatable)
  attachPath?: string[];         // --attach-path [path] (repeatable)
  attachCid?: string[];          // --attach-cid [cid] (repeatable)
  attachContentDisp?: string[];  // --attach-content-disp [inline|attachment] (repeatable)

  // List Options
  emailList?: string;            // --email-list [listName] (triggers repetitive mode)
  sendAll?: boolean;             // --send-all (send one email to all contacts on the list)
  log?: boolean;                 // --log (log sent email to logs/<n>.log)

  // Tool Options
  newList?: string;              // --new-list [listName]
  listToolPath?: string;         // --list-tool-path [path]

  // Mode Options
  text?: [string, string];       // -t, --text [address] [message] (raw mode)
  force?: boolean;               // -f, --force (skip confirmation)
  copy?: string;                 // -c, --copy [path] (copy tool, default tools mode)
  copyConfig?: string;           // -c:config, --copy:config [path] (copy config + support types only)
  copyConfigNoAccount?: string;  // -c:config-no-account, --copy:config-no-account [path] (config copy, no account setup)
  copyTool?: string;             // -c:tool, --copy:tool [path] (explicit full tool copy)
  help?: string;                 // -h, --help [section] (show help)
  test?: string;                 // --test [unitTest] (run tests)

  // Global Config Options
  globalConfig?: string[];       // --global-config <args> (default resolution)
  globalConfigRoot?: string[];   // --global-config:root <args> (sendEmail root only)
  globalConfigPath?: string[];   // --global-config:path <args> (CWD path only)

  // Terminal Format Options
  commandFormat?: boolean;       // --command-format (must be first option; activates terminal mode)

  // Derived
  mode?: SendMode;               // Determined from options
}

/**
 * Engine configuration - paths to each resource directory
 */
export interface EngineConfig {
  rootPath: string;             // Root directory of sendEmail tool instance
  accountsPath: string;         // Path to config/accounts/
  emailsPath: string;           // Path to config/emails/
  globalsPath: string;          // Path to config/globals/
  listsPath: string;            // Path to lists/
  attachmentsPath: string;      // Path to attachments/
  imagesPath: string;           // Path to img/
  logsPath: string;             // Path to logs/
  defaultAccount: string;       // Default account name (default: '_default')
}

/**
 * Result of a single email send operation
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: Error;
  recipient?: string;
}

/**
 * Result of a bulk email send operation
 */
export interface BulkSendResult {
  total: number;
  successful: number;
  failed: number;
  results: SendResult[];
}

/**
 * Option type classifications (from docs/sendEmail.md)
 */
export type OptionType =
  | 'mixed'                        // Can be string, array, or from config
  | 'normal'                       // Triggers normal send mode
  | 'raw'                          // Triggers raw send mode
  | 'repetitive'                   // Triggers repetitive (bulk) send mode
  | 'null'                         // Toggles default behavior on/off
  | 'null:reproductive'            // Produces reusable instances (e.g., --test)
  | 'null:reproductive <config>'          // Config-only copy (--copy:config)
  | 'null:reproductive <config:no-account>' // Config-only copy, no account setup (--copy:config-no-account)
  | 'null:reproductive <tools>'           // Full tool copy (--copy / --copy:tool)
  | 'null:productive'              // Documentation/maintenance (e.g., --help)
  | 'boolean'                      // Boolean flag, configurable (e.g., --log, --send-all)
  | 'aggressive'                   // Tool mode, disables sending
  | 'passive'                      // Requires an aggressive option to activate
  | 'terminal';                    // Activates terminal mode when passed as first option (--command-format)

/**
 * CLI option definition
 */
export interface OptionDefinition {
  flag: string;          // e.g., '-t, --text'
  description: string;
  type: OptionType;
  argument?: string;     // e.g., '[address]'
  defaultValue?: unknown;
  configurable: boolean; // Can appear in config files
}

/**
 * Inline attachment built from CLI args (--attach-file, --attach-path, etc.)
 */
export interface CLIAttachment {
  filename?: string;
  path?: string;
  cid?: string;
  contentDisposition?: 'attachment' | 'inline';
}

// ─── Configuration Type System ────────────────────────────────────────────────

/**
 * Configuration category — top-level grouping of sendEmail config files.
 * Used to distinguish which config/ subdirectory an item belongs to.
 */
export type ConfigCategory = 'accounts' | 'globals' | 'emails' | 'support';

/**
 * Account configuration item types.
 * Parent category: `accounts`
 *
 * - `account`          → any config/accounts/*.js file
 * - `account:default`  → config/accounts/_default.js
 * - `account:named`    → config/accounts/<fileName>.js (not _default)
 */
export type AccountConfigType =
  | 'account'
  | 'account:default'
  | 'account:named';

/**
 * Global configuration item types.
 * Parent category: `globals`
 *
 * - `global`                    → config/globals/<folderName>/  (the folder itself)
 * - `global:nested`             → config/globals/<folderName>/<nestItem> (unrecognized nested item)
 * - `global:configuration`      → config/globals/<folderName>/global.js
 * - `global:data:html`          → config/globals/<folderName>/html.htm[l]  (root-level HTML data file)
 * - `global:data:text`          → config/globals/<folderName>/text.txt     (root-level text data file)
 * - `global:data:folder`        → config/globals/<folderName>/html/ or data/ subfolder
 * - `global:data:folder:html`   → config/globals/<folderName>/html/ subfolder
 * - `global:data:folder:data`   → config/globals/<folderName>/data/ subfolder
 */
export type GlobalConfigType =
  | 'global'
  | 'global:nested'
  | 'global:configuration'
  | 'global:data:html'
  | 'global:data:text'
  | 'global:data:folder'
  | 'global:data:folder:html'
  | 'global:data:folder:data';

/**
 * Email configuration item types.
 * Parent category: `emails`
 *
 * - `email`                      → config/emails/<folderName>/  (the folder itself)
 * - `email:nested`               → config/emails/<folderName>/<nestItem> (unrecognized nested item)
 * - `email:configuration:js`     → config/emails/<folderName>/email.js
 * - `email:configuration:json`   → config/emails/<folderName>/email.json
 * - `email:data:folder`          → config/emails/<folderName>/html/ or data/ subfolder (either)
 * - `email:data:folder:html`     → config/emails/<folderName>/html/ subfolder
 * - `email:data:folder:data`     → config/emails/<folderName>/data/ subfolder
 * - `email:data:html`            → config/emails/<folderName>/html/<file.ext>  (primary type)
 * - `email:data:text`            → config/emails/<folderName>/data/<file.ext>  (primary type)
 * - `email:message:file:html`    → config/emails/<folderName>/html/<file.ext>  (sub-type: message html file)
 * - `email:message:file:text`    → config/emails/<folderName>/data/<file.ext>  (sub-type: message text file)
 */
export type EmailConfigType =
  | 'email'
  | 'email:nested'
  | 'email:configuration:js'
  | 'email:configuration:json'
  | 'email:data:folder'
  | 'email:data:folder:html'
  | 'email:data:folder:data'
  | 'email:data:html'
  | 'email:data:text'
  | 'email:message:file:html'
  | 'email:message:file:text';

/**
 * Union of all configuration item types across all categories.
 */
export type ConfigItemType = AccountConfigType | GlobalConfigType | EmailConfigType | SupportConfigType;

/**
 * Support item types — root-level support folders (img/, attachments/).
 * Parent category: `support`
 *
 * - `support`               → generic support entry
 * - `support <img>`         → img/ folder (embedded images)
 * - `support <attachment>`  → attachments/ folder
 */
export type SupportConfigType =
  | 'support'
  | 'support <img>'
  | 'support <attachment>';

/**
 * Fully resolved structure of a global folder.
 * Returned by `ConfigLoader.resolveGlobalFolder()`.
 *
 * A global folder (`config/globals/<folderName>/`) may contain:
 *   - `global.js`       — required configuration + attachments
 *   - `html.htm[l]`     — optional HTML data file (root-level, strict naming)
 *   - `text.txt`        — optional text data file (root-level, strict naming)
 *   - `html/<file>`     — optional HTML data file inside html/ subfolder (relaxed naming)
 *   - `data/<file>`     — optional text data file inside data/ subfolder (relaxed naming)
 *
 * Nested global folders are supported via slash-separated names, e.g. `'footer/billing'`
 * resolves to `config/globals/footer/billing/`.
 *
 * Resolution order (mirrors --global-config default switch):
 *   1. CWD/config/globals/<name>/   (--copy instance)
 *   2. ROOT/config/globals/<name>/  (sendEmail root)
 *   3. CWD/<name>/                  (CWD directory fallback)
 */
export interface GlobalDataResolution {
  /** The global name used to look it up, e.g. 'footer' or 'footer/billing' */
  name: string;
  /** Absolute path to the resolved global folder */
  folderPath: string;
  /**
   * Base path for resolving attachment paths declared in global.js.
   * Corresponds to the root directory from which the global was found:
   *   - CWD   when found in CWD/config/globals/ or CWD/<name>/
   *   - rootPath when found in ROOT/config/globals/
   */
  assetBasePath: string;
  /** Absolute path to global.js, if present */
  configFilePath?: string;
  /** Absolute path to the resolved HTML data file, if present */
  htmlDataPath?: string;
  /** Absolute path to the resolved text data file, if present */
  textDataPath?: string;
  /** Type classification for where the HTML data was found */
  htmlDataType?: 'global:data:html' | 'global:data:folder:html';
  /** Type classification for where the text data was found */
  textDataType?: 'global:data:text' | 'global:data:folder:data';
}

// ─── Terminal Format Types ─────────────────────────────────────────────────────

/**
 * Result of executing a single terminal command via terminal mode.
 */
export interface TerminalCommandResult {
  /** The raw command string that was executed */
  command: string;
  /** Captured stdout output (trimmed) */
  output: string;
  /** Exit code from the child process */
  exitCode: number;
}

/**
 * Result of parsing and executing a complete terminal-format argument value.
 * A single argument may contain multiple `$>command: {{ ... }};` blocks.
 */
export interface TerminalFormatResult {
  /** Original argument value before processing */
  original: string;
  /** Resolved value after executing all commands and concatenating outputs */
  resolved: string;
  /** Individual results from each command block found in the argument */
  commands: TerminalCommandResult[];
}
