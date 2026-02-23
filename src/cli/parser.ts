/**
 * parser.ts
 * CLI argument parsing using the 'commander' library.
 * Defines all options, validates types, and determines SendMode.
 */

import { Command } from 'commander';
import type { CLIOptions } from '../core/types.js';
import { SendMode } from '../core/types.js';

/**
 * Parse command-line arguments into a CLIOptions object.
 * @param argv - process.argv or a custom array (for testing)
 */
export function parseArguments(argv: string[] = process.argv): CLIOptions {
  const program = new Command();

  program
    .name('sendEmail')
    .description('Command-line tool to send an email, or automate repetitive emails.')
    .allowUnknownOption(false)
    .enablePositionalOptions();

  // ── Non-configurable Options ──────────────────────────────────────────────

  program
    .option('--account <name>', 'Specify a configured account from config/accounts/')
    .option('--config-email <name>', 'Use a configured email from config/emails/ [normal|repetitive]')
    .option('-c, --copy [path]', 'Copy the sendEmail tool to a path (or CWD if no path) [null:reproductive]')
    .option('-h, --help [section]', 'Display help documentation; optionally specify a section [null:productive]')
    .option('-f, --force', 'Skip the confirmation prompt before sending [null]')
    .option('--test [unitTest]', 'Run all tests or a specific unit test [null:reproductive]')
    .option('-t, --text <address> [message]', 'Quick raw text email [raw]');

  // ── Configurable Options ──────────────────────────────────────────────────

  program
    .option('--send-to <address...>', 'Recipient address(es) [mixed]')
    .option('--subject <text>', 'Email subject [mixed]')
    .option('--message-file <path>', 'Message file (.txt, .html, .htm, .md) [mixed]')
    .option('--message-html <path>', 'HTML message file (explicit) [mixed]')
    .option('--message-text <path>', 'Plain text message file (explicit) [mixed]')
    .option('--from-address <email>', 'From address (overrides account setting) [mixed]')
    .option('--reply-to <email...>', 'Reply-to address(es) [mixed]')
    .option('--cc <address...>', 'CC recipient(s) [mixed]')
    .option('--bcc <address...>', 'BCC recipient(s) [mixed]')
    .option('--attach-file <filename...>', 'Attachment filename(s) [mixed]')
    .option('--attach-path <path...>', 'Attachment path(s) [mixed]')
    .option('--attach-cid <cid...>', 'Content ID(s) for inline images [mixed]')
    .option('--attach-content-disp <value...>', 'Content disposition(s): inline|attachment [mixed]')
    .option('--global-config <args...>', 'Load a global config by name or path (default resolution) [mixed]')
    .option('--global-config-root <args...>', 'Load a global config from sendEmail root globals only [mixed]')
    .option('--global-config-path <args...>', 'Load a global config from CWD path only [mixed]');

  // ── List Options ──────────────────────────────────────────────────────────

  program
    .option('--email-list <listName>', 'Email list for bulk sending (triggers repetitive mode) [repetitive]')
    .option('--send-all', 'Send one email to all contacts on the list [configurable]');

  // ── Tool Options ──────────────────────────────────────────────────────────

  program
    .option('--new-list <listName>', 'Create an email list from tool files [aggressive]')
    .option('--list-tool-path <path>', 'Path to tool files for --new-list [passive]');

  // Override default help to allow our custom -h implementation
  program.helpOption(false);

  // Parse (exit on error is handled by commander)
  program.exitOverride();

  try {
    program.parse(normalizeArgv(argv));
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    // commander throws for unknown options - let it propagate
    if (error.code !== 'commander.helpDisplayed') {
      throw err;
    }
  }

  const opts = program.opts<Record<string, unknown>>();

  // Build CLIOptions
  const cliOpts: CLIOptions = {
    account: opts['account'] as string | undefined,
    configEmail: opts['configEmail'] as string | undefined,
    sendTo: opts['sendTo'] as string[] | undefined,
    subject: opts['subject'] as string | undefined,
    messageFile: opts['messageFile'] as string | undefined,
    messageHtml: opts['messageHtml'] as string | undefined,
    messageText: opts['messageText'] as string | undefined,
    fromAddress: opts['fromAddress'] as string | undefined,
    replyTo: opts['replyTo'] as string[] | undefined,
    cc: opts['cc'] as string[] | undefined,
    bcc: opts['bcc'] as string[] | undefined,
    attachFile: opts['attachFile'] as string[] | undefined,
    attachPath: opts['attachPath'] as string[] | undefined,
    attachCid: opts['attachCid'] as string[] | undefined,
    attachContentDisp: opts['attachContentDisp'] as string[] | undefined,
    emailList: opts['emailList'] as string | undefined,
    sendAll: opts['sendAll'] as boolean | undefined,
    newList: opts['newList'] as string | undefined,
    listToolPath: opts['listToolPath'] as string | undefined,
    force: opts['force'] as boolean | undefined,
    copy: opts['copy'] as string | undefined,
    help: opts['help'] as string | undefined,
    test: opts['test'] as string | undefined,
    globalConfig: opts['globalConfig'] as string[] | undefined,
    globalConfigRoot: opts['globalConfigRoot'] as string[] | undefined,
    globalConfigPath: opts['globalConfigPath'] as string[] | undefined,
  };

  // Handle -t / --text (next two positional args after -t)
  const rawArgs = program.args;
  if (opts['text']) {
    const addr = rawArgs[0] ?? (opts['text'] as string);
    const msg = rawArgs[1] ?? rawArgs[0] ?? '';
    if (typeof opts['text'] === 'string' && opts['text'].includes('@')) {
      cliOpts.text = [opts['text'] as string, rawArgs[0] ?? ''];
    } else {
      cliOpts.text = [addr, msg];
    }
  }

  // Determine send mode
  cliOpts.mode = determineSendMode(cliOpts);

  return cliOpts;
}

/**
 * Determine the SendMode based on which options were provided.
 */
function determineSendMode(opts: CLIOptions): SendMode {
  // Tool modes (no sending)
  if (opts.copy !== undefined) return SendMode.RAW; // tool mode, handled before send
  if (opts.newList !== undefined) return SendMode.RAW; // tool mode
  if (opts.test !== undefined) return SendMode.RAW; // tool mode

  // Repetitive mode: requires both configEmail and emailList
  if (opts.emailList) return SendMode.REPETITIVE;

  // Raw mode: -t / --text
  if (opts.text) return SendMode.RAW;

  // Normal mode: anything else with a sendTo or configEmail
  if (opts.sendTo || opts.configEmail || opts.messageFile || opts.messageHtml || opts.messageText) {
    return SendMode.NORMAL;
  }

  // Default to normal
  return SendMode.NORMAL;
}

/**
 * Normalize argv to convert --global-config:<switch> colon-syntax to kebab-case
 * before passing to Commander, which does not support colons in option names.
 *   --global-config:root  →  --global-config-root
 *   --global-config:path  →  --global-config-path
 */
function normalizeArgv(argv: string[]): string[] {
  return argv.map(arg => {
    if (arg === '--global-config:root') return '--global-config-root';
    if (arg === '--global-config:path') return '--global-config-path';
    return arg;
  });
}
