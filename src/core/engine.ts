/**
 * engine.ts
 * Core EmailEngine class - the primary interface-agnostic email sending engine.
 * Can be plugged into CLI, VS Code extensions, GUIs, or any other interface.
 */

import nodemailer from 'nodemailer';
import path from 'path';
import { ConfigLoader } from './config-loader.js';
import { TemplateEngine } from './template-engine.js';
import { AttachmentLoader } from './attachment-loader.js';
import { ListProcessor } from './list-processor.js';
import { validateEmailMessage } from './validator.js';
import { readFile } from '../utils/file-utils.js';
import { markdownToHtml } from '../utils/markdown-html.js';
import { getContentType } from '../utils/file-utils.js';
import { debug, info } from '../utils/logger.js';
import { ConfigurationError, NetworkError } from '../utils/error-handler.js';
import type {
  EngineConfig,
  EmailConfig,
  EmailMessage,
  Attachment,
  EmailList,
  TemplateVariables,
  SendResult,
  BulkSendResult,
  AccountConfig,
} from './types.js';

/**
 * Creates a default EngineConfig using a given root path.
 * All paths are resolved relative to the root.
 */
export function createEngineConfig(rootPath: string): EngineConfig {
  return {
    rootPath,
    accountsPath: path.resolve(rootPath, 'config', 'accounts'),
    emailsPath: path.resolve(rootPath, 'config', 'emails'),
    globalsPath: path.resolve(rootPath, 'config', 'globals'),
    listsPath: path.resolve(rootPath, 'lists'),
    attachmentsPath: path.resolve(rootPath, 'attachments'),
    imagesPath: path.resolve(rootPath, 'img'),
    defaultAccount: '_default',
  };
}

export class EmailEngine {
  private configLoader: ConfigLoader;
  private templateEngine: TemplateEngine;
  private attachmentLoader: AttachmentLoader;
  private listProcessor: ListProcessor;
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: EngineConfig) {
    this.configLoader = new ConfigLoader(config);
    this.templateEngine = new TemplateEngine();
    this.attachmentLoader = new AttachmentLoader(config);
    this.listProcessor = new ListProcessor();
  }

  /**
   * Initialize the email transporter using the specified account.
   * Must be called before sending.
   */
  async initialize(accountName?: string): Promise<void> {
    const name = accountName ?? this.config.defaultAccount;
    debug(`Initializing with account: ${name}`);

    const { accountConfig, transporter } = await this.configLoader.loadAccount(name);

    if (transporter) {
      // Legacy format: use the transporter directly
      this.transporter = transporter as nodemailer.Transporter;
    } else if (accountConfig) {
      // New-style format: create transporter from config
      this.transporter = nodemailer.createTransport(accountConfig as AccountConfig);
    } else {
      throw new ConfigurationError(
        `Account '${name}' could not be loaded`,
        ['No valid account configuration found.']
      );
    }
  }

  /**
   * Load email configuration by name from config/emails/
   */
  async loadEmailConfig(emailName: string): Promise<EmailConfig> {
    return this.configLoader.loadEmailConfig(emailName);
  }

  /**
   * Load email list by name from lists/
   */
  async loadEmailList(listName: string): Promise<EmailList> {
    return this.configLoader.loadEmailList(listName);
  }

  /**
   * Load emailAttachments from config/emails/<emailName>/email.js
   */
  async loadEmailAttachments(emailName: string): Promise<Attachment[]> {
    return this.configLoader.loadEmailAttachments(emailName);
  }

  /**
   * Build a complete nodemailer-ready EmailMessage from config and template variables.
   */
  async buildMessage(
    emailConfig: EmailConfig,
    templateVars: TemplateVariables,
    overrides: Partial<EmailConfig & { attachments?: Attachment[] }> = {}
  ): Promise<EmailMessage> {
    const merged = { ...emailConfig, ...overrides };

    // Resolve 'from' account to an email address
    let fromAddress: string;
    if (merged.from && merged.from.includes('@')) {
      fromAddress = merged.from;
    } else {
      // from is an account name - get user from transporter config
      fromAddress = this.getAccountEmail();
    }

    // Resolve 'to'
    const to = overrides.to ?? merged.to ?? '';
    const resolvedTo = this.applyTemplateToAddresses(to, templateVars);

    // Resolve 'bcc'
    const bcc = merged.bcc
      ? this.applyTemplateToAddresses(merged.bcc, templateVars)
      : undefined;

    // Resolve 'cc'
    const cc = merged.cc
      ? this.applyTemplateToAddresses(merged.cc, templateVars)
      : undefined;

    // Resolve 'replyTo'
    const replyTo = merged.replyTo
      ? this.applyTemplateToAddresses(merged.replyTo, templateVars)
      : undefined;

    // Resolve subject
    const subject = this.templateEngine.substitute(
      merged.subject ?? '',
      templateVars
    );

    // Load and concatenate HTML content
    let html: string | undefined;
    if (merged.html) {
      html = await this.loadHtmlContent(emailConfig, merged.html, templateVars);
    }

    // Load text content
    let text: string | undefined;
    if (merged.text) {
      const rawText = await this.loadTextContent(merged.text);
      text = this.templateEngine.substitute(rawText, templateVars);
    }

    // Load attachments
    let attachments: Attachment[] = overrides.attachments ?? [];
    if (attachments.length === 0 && emailConfig.attachments) {
      // Lookup via name from email.js exports isn't supported in this path;
      // caller should provide pre-loaded attachments via overrides
    }

    // Load and merge global attachments
    if (emailConfig.globals) {
      for (const globalName of emailConfig.globals) {
        const globalAtts = await this.configLoader.loadGlobalAttachments(globalName);
        attachments = [...attachments, ...globalAtts];
      }
    }

    const message: EmailMessage = {
      from: fromAddress,
      to: resolvedTo,
      subject,
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(replyTo && { replyTo }),
      ...(html && { html }),
      ...(text && { text }),
      ...(attachments.length > 0 && {
        attachments: this.attachmentLoader.resolveAttachments(attachments),
      }),
    };

    validateEmailMessage(message);
    return message;
  }

  /**
   * Send a single email message.
   */
  async sendEmail(message: EmailMessage): Promise<SendResult> {
    if (!this.transporter) {
      throw new ConfigurationError(
        'Engine not initialized',
        ['Call engine.initialize() before sending.']
      );
    }

    const recipient = Array.isArray(message.to) ? message.to[0] : message.to;
    debug(`Sending to: ${recipient}`);

    try {
      const info = await this.transporter.sendMail(message);
      return {
        success: true,
        messageId: info.messageId as string,
        recipient,
      };
    } catch (err) {
      const error = err as Error;
      throw new NetworkError(
        `Failed to send email to '${recipient}'`,
        [error.message],
        `Check your account credentials and SMTP settings in config/accounts/`
      );
    }
  }

  /**
   * Send emails to an entire email list (repetitive mode).
   * Calls onProgress after each send.
   */
  async sendBulk(
    emailConfig: EmailConfig,
    emailList: EmailList,
    overrides: Partial<EmailConfig & { attachments?: Attachment[] }> = {},
    onProgress?: (current: number, total: number, result: SendResult) => void
  ): Promise<BulkSendResult> {
    const results: SendResult[] = [];
    let successful = 0;
    let failed = 0;

    for await (const { contact, variables, index, total } of this.listProcessor.process(emailList)) {
      // Override 'to' with the current contact's email
      const contactOverrides = {
        ...overrides,
        to: contact.email,
      };

      let result: SendResult;
      try {
        const message = await this.buildMessage(emailConfig, variables, contactOverrides);
        result = await this.sendEmail(message);
        successful++;
        info(`Sent (${index + 1}/${total}): ${contact.email}`);
      } catch (err) {
        const error = err as Error;
        result = { success: false, error, recipient: contact.email };
        failed++;
      }

      results.push(result);
      onProgress?.(index + 1, total, result);
    }

    return { total: results.length, successful, failed, results };
  }

  /**
   * Preview an email message without sending it.
   * Returns the built EmailMessage for inspection.
   */
  async preview(
    emailConfig: EmailConfig,
    templateVars: TemplateVariables,
    overrides: Partial<EmailConfig & { attachments?: Attachment[] }> = {}
  ): Promise<EmailMessage> {
    return this.buildMessage(emailConfig, templateVars, overrides);
  }

  /**
   * Verify connectivity to the SMTP server.
   */
  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  getAccountEmail(): string {
    // Try to get from transporter options
    try {
      const opts = (this.transporter as unknown as { options?: { auth?: { user?: string } } }).options;
      return opts?.auth?.user ?? 'noreply@example.com';
    } catch {
      return 'noreply@example.com';
    }
  }

  private applyTemplateToAddresses(
    addresses: string | string[],
    vars: TemplateVariables
  ): string | string[] {
    if (Array.isArray(addresses)) {
      return addresses.map(a => this.templateEngine.substitute(a, vars));
    }
    return this.templateEngine.substitute(addresses, vars);
  }

  private async loadHtmlContent(
    emailConfig: EmailConfig,
    htmlRef: string | string[],
    vars: TemplateVariables
  ): Promise<string> {
    const refs = Array.isArray(htmlRef) ? htmlRef : [htmlRef];

    // If refs look like file references (no @ sign), load from email's html/ folder
    const parts: string[] = [];

    for (const ref of refs) {
      let content: string;

      if (ref.includes('@') || ref.includes('<')) {
        // It's already HTML content, not a file reference
        content = ref;
      } else {
        // Treat as a file name in the email's html/ directory
        // emailConfig doesn't have a name here - we need it from context
        // For now, load as a raw file path relative to root
        const filePath = path.resolve(this.config.rootPath, ref);
        content = await readFile(filePath);
      }

      parts.push(this.templateEngine.substitute(content, vars));
    }

    return parts.join('\n');
  }

  private async loadTextContent(textRef: string): Promise<string> {
    // If it looks like a file path, load it
    if (!textRef.includes('\n') && textRef.length < 500) {
      try {
        const filePath = path.resolve(this.config.rootPath, textRef);
        const content = await readFile(filePath);
        const type = getContentType(filePath);
        if (type === 'markdown') {
          return markdownToHtml(content);
        }
        return content;
      } catch {
        // Not a file path - treat as raw text
      }
    }
    return textRef;
  }
}
