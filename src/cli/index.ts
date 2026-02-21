/**
 * index.ts
 * CLI entry point - wires together argument parsing, engine, and prompts.
 * This file is the main runnable script for the sendEmail CLI tool.
 */

import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { parseArguments } from './parser.js';
import { printHelp } from './help.js';
import { confirmSend, confirmBulkSend, confirmSendAll } from './prompts.js';
import { EmailEngine, createEngineConfig } from '../core/engine.js';
import { ListGenerator } from '../tools/list-generator.js';
import { CopyTool } from '../tools/copy-tool.js';
import { TestRunner } from '../tools/test-runner.js';
import { AttachmentLoader } from '../core/attachment-loader.js';
import { TemplateEngine } from '../core/template-engine.js';
import { handleError } from '../utils/error-handler.js';
import { info, success, error as logError, warn } from '../utils/logger.js';
import { SendMode } from '../core/types.js';
import type { EmailConfig, Attachment, TemplateVariables, EmailContact, EmailList } from '../core/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** The installed/linked package root (dist/cli/ → dist/ → root). */
function packageRoot(): string {
  return path.resolve(__dirname, '..', '..');
}

/**
 * Resolve config root for email operations.
 * Checks for a local sendEmail copy in the calling directory (created via
 * --copy) and uses it if found. Checks CWD/sendEmail/ first, then CWD
 * itself, before falling back to the npm-linked package root.
 */
function findRootPath(): string {
  const cwd = process.cwd();
  const sub = path.join(cwd, 'sendEmail');
  if (existsSync(path.join(sub, 'config', 'emails'))) return sub;
  if (existsSync(path.join(cwd, 'config', 'emails'))) return cwd;
  return packageRoot();
}

/**
 * Main CLI entry point.
 */
export async function run(argv?: string[]): Promise<void> {
  const opts = parseArguments(argv);

  // ── Help ──────────────────────────────────────────────────────────────────
  if (opts.help !== undefined) {
    printHelp(typeof opts.help === 'string' ? opts.help : undefined);
    return;
  }

  // ── Tool: Copy ────────────────────────────────────────────────────────────
  if (opts.copy !== undefined) {
    const cwd = process.cwd();
    const cwdName = path.basename(cwd);
    const parentName = path.basename(path.dirname(cwd));

    if (cwdName === 'sendEmail' || parentName === 'sendEmail') {
      logError('Cannot run --copy from inside the sendEmail tool directory.');
      logError('Navigate to a different directory first, then run: sendEmail --copy');
      process.exit(1);
    }

    const copyTool = new CopyTool();
    const dest = typeof opts.copy === 'string' ? opts.copy : path.join(cwd, 'sendEmail');
    await copyTool.copy(packageRoot(), dest);
    return;
  }

  // ── Tool: New List ────────────────────────────────────────────────────────
  if (opts.newList) {
    const rootPath = findRootPath();
    const generator = new ListGenerator(rootPath);
    const toolPath = opts.listToolPath ?? process.cwd();
    const outputPath = path.resolve(rootPath, 'lists', `${opts.newList}.json`);
    await generator.generate(opts.newList, toolPath, outputPath);
    return;
  }

  // ── Tool: Test ────────────────────────────────────────────────────────────
  if (opts.test !== undefined) {
    const runner = new TestRunner(findRootPath());
    await runner.run(typeof opts.test === 'string' ? opts.test : undefined);
    return;
  }

  // ── Email Sending ─────────────────────────────────────────────────────────

  const rootPath = findRootPath();
  const engineConfig = createEngineConfig(rootPath);
  const engine = new EmailEngine(engineConfig);
  const attachmentLoader = new AttachmentLoader(engineConfig);
  const templateEngine = new TemplateEngine();

  // Initialize with specified or default account
  await engine.initialize(opts.account);

  // ── Raw Mode: -t / --text ─────────────────────────────────────────────────
  if (opts.mode === SendMode.RAW && opts.text) {
    const [address, messageText] = opts.text;

    if (!address) {
      logError('--text requires an email address');
      process.exit(1);
    }

    const message = {
      from: opts.fromAddress ?? '',
      to: address,
      subject: opts.subject ?? '(no subject)',
      text: messageText || '(empty message)',
    };

    if (!message.from) {
      message.from = engine.getAccountEmail();
    }

    const confirmed = await confirmSend(message as Parameters<typeof confirmSend>[0], opts.force);
    if (!confirmed) {
      info('Send cancelled.');
      return;
    }

    const result = await engine.sendEmail(message as Parameters<typeof engine.sendEmail>[0]);
    if (result.success) {
      success(`Email sent to ${address} (${result.messageId})`);
    } else {
      logError(`Failed to send: ${result.error?.message}`);
      process.exit(1);
    }
    return;
  }

  // ── Load email config (needed before mode branching for config-based lists) ──

  let emailConfig: EmailConfig = {};

  if (opts.configEmail) {
    emailConfig = await engine.loadEmailConfig(opts.configEmail);
  }

  // Resolve effective list source: CLI --email-list > config emailList > config email-list (inline)
  const effectiveListName = opts.emailList ?? emailConfig.emailList;
  const inlineList: EmailContact[] | undefined = emailConfig['email-list'];
  const hasList = !!(effectiveListName || inlineList);

  // Resolve sendAll: CLI --send-all > config sendAll
  const sendAll = opts.sendAll || emailConfig.sendAll === true;

  // Load the email list (from file or inline)
  let emailList: EmailList | undefined;

  if (effectiveListName) {
    emailList = await engine.loadEmailList(effectiveListName);
  } else if (inlineList) {
    emailList = { 'email-list': inlineList };
  }

  // Build overrides from CLI options
  const overrides = buildOverrides(opts);

  // Load attachments (shared by all list-based and normal modes)
  let attachments: Attachment[] = [];

  if (opts.configEmail) {
    const configAtts = await engine.loadEmailAttachments(opts.configEmail);
    attachments = [...attachments, ...configAtts];
  }

  const cliAtts = attachmentLoader.buildFromCLI({
    attachFile: opts.attachFile,
    attachPath: opts.attachPath,
    attachCid: opts.attachCid,
    attachContentDisp: opts.attachContentDisp,
  });

  attachments = [...attachments, ...cliAtts];

  if (attachments.length > 0) {
    overrides.attachments = attachments;
  }

  // ── Send-All Mode ──────────────────────────────────────────────────────────
  if (sendAll && hasList && emailList) {
    if (!opts.configEmail) {
      logError('--config-email is required when using --send-all');
      process.exit(1);
    }

    const contacts = emailList['email-list'];
    const count = contacts.length;
    const listSource = effectiveListName ?? 'embedded';

    const confirmed = await confirmSendAll(listSource, count, opts.force);
    if (!confirmed) {
      info('Send cancelled.');
      return;
    }

    // Collect all recipient emails
    const allRecipients = contacts.map(c => c.email);

    // Build template variables without contact-specific vars
    const vars: TemplateVariables = templateEngine.buildSingleVars(
      allRecipients[0] ?? '',
      opts.subject ?? emailConfig.subject
    );

    // Build message with all recipients in "to"
    const sendAllOverrides = { ...overrides, to: allRecipients };
    const message = await engine.buildMessage(emailConfig, vars, sendAllOverrides);

    // Strip CH-EMAILONLIST placeholder (not applicable in send-all mode)
    if (message.html) {
      message.html = message.html.replace(/ CH-EMAILONLIST/g, '');
      message.html = message.html.replace(/CH-EMAILONLIST/g, '');
    }
    if (message.text) {
      message.text = message.text.replace(/ CH-EMAILONLIST/g, '');
      message.text = message.text.replace(/CH-EMAILONLIST/g, '');
    }
    message.subject = message.subject.replace(/ CH-EMAILONLIST/g, '');
    message.subject = message.subject.replace(/CH-EMAILONLIST/g, '');

    info(`Sending one email to ${count} recipients from list '${listSource}'...`);

    const result = await engine.sendEmail(message);

    if (result.success) {
      success(`Email sent to ${count} recipients (${result.messageId})`);
    } else {
      logError(`Failed to send: ${result.error?.message}`);
      process.exit(1);
    }
    return;
  }

  if (sendAll && !hasList) {
    logError('--send-all requires an email list (--email-list or emailList/email-list in email.json)');
    process.exit(1);
  }

  // ── Repetitive Mode ───────────────────────────────────────────────────────
  if (hasList && emailList) {
    if (!opts.configEmail) {
      logError('--config-email is required for repetitive mode (--email-list)');
      process.exit(1);
    }

    const count = emailList['email-list'].length;
    const listSource = effectiveListName ?? 'embedded';

    const confirmed = await confirmBulkSend(listSource, count, opts.force);
    if (!confirmed) {
      info('Bulk send cancelled.');
      return;
    }

    info(`Sending to ${count} recipients from list '${listSource}'...`);

    const result = await engine.sendBulk(
      emailConfig,
      emailList,
      overrides,
      (current, total, sendResult) => {
        if (sendResult.success) {
          info(`  Sent ${current}/${total}: ${sendResult.recipient}`);
        } else {
          warn(`  Failed ${current}/${total}: ${sendResult.recipient} - ${sendResult.error?.message}`);
        }
      }
    );

    console.log();
    success(`Bulk send complete: ${result.successful}/${result.total} sent, ${result.failed} failed.`);

    if (result.failed > 0) {
      process.exit(1);
    }
    return;
  }

  // ── Normal Mode ───────────────────────────────────────────────────────────

  // Build template variables for single send
  const to = Array.isArray(overrides.to ?? emailConfig.to)
    ? (overrides.to ?? emailConfig.to as string[])[0] ?? ''
    : (overrides.to ?? emailConfig.to ?? '') as string;

  const vars: TemplateVariables = templateEngine.buildSingleVars(to, opts.subject ?? emailConfig.subject);

  // Build and preview message
  const message = await engine.buildMessage(emailConfig, vars, overrides);

  const confirmed = await confirmSend(message, opts.force);
  if (!confirmed) {
    info('Send cancelled.');
    return;
  }

  const result = await engine.sendEmail(message);

  if (result.success) {
    success(`Email sent to ${result.recipient} (${result.messageId})`);
  } else {
    logError(`Failed to send: ${result.error?.message}`);
    process.exit(1);
  }
}

/**
 * Build EmailConfig overrides from CLI options.
 */
function buildOverrides(opts: ReturnType<typeof parseArguments>): Partial<EmailConfig & { attachments?: Attachment[] }> {
  const overrides: Partial<EmailConfig & { attachments?: Attachment[] }> = {};

  if (opts.sendTo) overrides.to = opts.sendTo.length === 1 ? opts.sendTo[0] : opts.sendTo;
  if (opts.subject) overrides.subject = opts.subject;
  if (opts.fromAddress) overrides.from = opts.fromAddress;
  if (opts.replyTo) overrides.replyTo = opts.replyTo.length === 1 ? opts.replyTo[0] : opts.replyTo;
  if (opts.cc) overrides.cc = opts.cc.length === 1 ? opts.cc[0] : opts.cc;
  if (opts.bcc) overrides.bcc = opts.bcc.length === 1 ? opts.bcc[0] : opts.bcc;

  // Message content
  if (opts.messageHtml) overrides.html = opts.messageHtml;
  else if (opts.messageText) overrides.text = opts.messageText;
  else if (opts.messageFile) overrides.html = opts.messageFile; // engine handles type detection

  return overrides;
}

// Run when called directly (not when imported by bin/sendEmail.js)
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  run().catch(err => {
    handleError(err, true);
  });
}
