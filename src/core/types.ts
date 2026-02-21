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
  messageHtml?: string;          // --message-html [path]
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

  // Tool Options
  newList?: string;              // --new-list [listName]
  listToolPath?: string;         // --list-tool-path [path]

  // Mode Options
  text?: [string, string];       // -t, --text [address] [message] (raw mode)
  force?: boolean;               // -f, --force (skip confirmation)
  copy?: string;                 // -c, --copy [path] (copy tool)
  help?: string;                 // -h, --help [section] (show help)
  test?: string;                 // --test [unitTest] (run tests)

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
  | 'mixed'              // Can be string, array, or from config
  | 'normal'             // Triggers normal send mode
  | 'raw'                // Triggers raw send mode
  | 'repetitive'         // Triggers repetitive (bulk) send mode
  | 'null'               // Toggles default behavior on/off
  | 'null:reproductive'  // Produces reusable instances (e.g., --copy, --test)
  | 'null:productive'    // Documentation/maintenance (e.g., --help)
  | 'aggressive'         // Tool mode, disables sending
  | 'passive';           // Requires an aggressive option to activate

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
