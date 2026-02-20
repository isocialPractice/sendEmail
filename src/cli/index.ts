/**
 * index.ts
 * CLI entry point - wires together argument parsing, engine, and prompts.
 * This file is the main runnable script for the sendEmail CLI tool.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { parseArguments } from './parser.js';
import { printHelp } from './help.js';
import { confirmSend, confirmBulkSend } from './prompts.js';
import { EmailEngine, createEngineConfig } from '../core/engine.js';
import { ListGenerator } from '../tools/list-generator.js';
import { CopyTool } from '../tools/copy-tool.js';
import { TestRunner } from '../tools/test-runner.js';
import { AttachmentLoader } from '../core/attachment-loader.js';
import { TemplateEngine } from '../core/template-engine.js';
import { handleError } from '../utils/error-handler.js';
import { info, success, error as logError, warn } from '../utils/logger.js';
import { SendMode } from '../core/types.js';
import type { EmailConfig, Attachment, TemplateVariables } from '../core/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Determine the root path of the sendEmail tool.
 * Uses the directory containing the running script.
 */
function findRootPath(): string {
  // Walk up from __dirname (dist/cli/) to find root
  return path.resolve(__dirname, '..', '..');
}

/**
 * Main CLI entry point.
 */
export async function run(argv?: string[]): Promise<void> {
  const opts = parseArguments(argv);

  // ── Help ──────────────────────────────────────────────────────────────────
  if (opts.help !== undefined) {
    printHelp(opts.help || undefined);
    return;
  }

  // ── Tool: Copy ────────────────────────────────────────────────────────────
  if (opts.copy !== undefined) {
    const copyTool = new CopyTool();
    const dest = opts.copy || process.cwd();
    await copyTool.copy(findRootPath(), dest);
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
    await runner.run(opts.test || undefined);
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

    // Fill from address if empty (will be set by engine)
    if (!message.from) {
      // Will use account's from address - set a placeholder
      message.from = 'noreply@example.com';
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

  // ── Repetitive Mode ───────────────────────────────────────────────────────
  if (opts.mode === SendMode.REPETITIVE && opts.emailList) {
    if (!opts.configEmail) {
      logError('--config-email is required for repetitive mode (--email-list)');
      process.exit(1);
    }

    const emailConfig = await engine.loadEmailConfig(opts.configEmail);
    const emailList = await engine.loadEmailList(opts.emailList);
    const count = emailList['email-list'].length;

    const confirmed = await confirmBulkSend(opts.emailList, count, opts.force);
    if (!confirmed) {
      info('Bulk send cancelled.');
      return;
    }

    // Build overrides from CLI options
    const overrides = buildOverrides(opts);
    const extraAttachments = attachmentLoader.buildFromCLI({
      attachFile: opts.attachFile,
      attachPath: opts.attachPath,
      attachCid: opts.attachCid,
      attachContentDisp: opts.attachContentDisp,
    });

    if (extraAttachments.length > 0) {
      overrides.attachments = extraAttachments;
    }

    info(`Sending to ${count} recipients from list '${opts.emailList}'...`);

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

  // Build base email config
  let emailConfig: EmailConfig = {};

  if (opts.configEmail) {
    emailConfig = await engine.loadEmailConfig(opts.configEmail);
  }

  // Apply CLI overrides
  const overrides = buildOverrides(opts);

  // Build template variables for single send
  const to = Array.isArray(overrides.to ?? emailConfig.to)
    ? (overrides.to ?? emailConfig.to as string[])[0] ?? ''
    : (overrides.to ?? emailConfig.to ?? '') as string;

  const vars: TemplateVariables = templateEngine.buildSingleVars(to, opts.subject ?? emailConfig.subject);

  // Load attachments
  let attachments: Attachment[] = [];

  if (opts.configEmail) {
    const configAtts = await getConfigAttachments(engine, opts.configEmail, engineConfig);
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

/**
 * Load email.js attachments for a configured email.
 */
async function getConfigAttachments(
  engine: EmailEngine,
  configEmail: string,
  engineConfig: ReturnType<typeof createEngineConfig>
): Promise<Attachment[]> {
  try {
    const { ConfigLoader } = await import('../core/config-loader.js');
    const loader = new ConfigLoader(engineConfig);
    return loader.loadEmailAttachments(configEmail);
  } catch {
    return [];
  }
}

// Run when called directly
run().catch(err => {
  handleError(err, true);
});
