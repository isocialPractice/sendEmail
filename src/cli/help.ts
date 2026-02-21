/**
 * help.ts
 * Help documentation generator for the sendEmail CLI.
 * Supports sections: options, options:configurable, options:non-configurable,
 *   options:tool, arguments, arguments:configurable, arguments:non-configurable
 */

import chalk from 'chalk';

const TOOL_NAME = 'sendEmail';

interface OptionEntry {
  flag: string;
  description: string;
  type: string;
  configurable: boolean;
  isTool?: boolean;
}

const OPTIONS: OptionEntry[] = [
  // Non-configurable
  { flag: '--account <name>', description: 'Specify a configured account from config/accounts/', type: 'mixed', configurable: false },
  { flag: '--config-email <name>', description: 'Use a configured email from config/emails/', type: 'normal | repetitive', configurable: false },
  { flag: '-c, --copy [path]', description: 'Copy sendEmail to path (or CWD if no path given)', type: 'null:reproductive', configurable: false },
  { flag: '-h, --help [section]', description: 'Show help. Sections: options, options:configurable, options:non-configurable, options:tool, arguments, arguments:configurable, arguments:non-configurable', type: 'null:productive', configurable: false },
  { flag: '-f, --force', description: 'Skip confirmation prompt before sending', type: 'null', configurable: false },
  { flag: '--test [unitTest]', description: 'Run all tests or a specific unit test by name', type: 'null:reproductive', configurable: false },
  { flag: '-t, --text <address> [message]', description: 'Quick text email: send a raw message directly to address', type: 'raw', configurable: false },
  // Configurable
  { flag: '--send-to <address...>', description: 'Recipient address(es)', type: 'mixed', configurable: true },
  { flag: '--subject <text>', description: 'Email subject line', type: 'mixed', configurable: true },
  { flag: '--message-file <path>', description: 'Message file (.txt, .html, .htm, .md). Extension determines type.', type: 'mixed', configurable: true },
  { flag: '--message-html <path>', description: 'HTML message file (explicit)', type: 'mixed', configurable: true },
  { flag: '--message-text <path>', description: 'Plain text message file (explicit)', type: 'mixed', configurable: true },
  { flag: '--from-address <email>', description: 'From address (overrides account setting)', type: 'mixed', configurable: true },
  { flag: '--reply-to <email...>', description: 'Reply-to address(es)', type: 'mixed', configurable: true },
  { flag: '--cc <address...>', description: 'CC recipient(s)', type: 'mixed', configurable: true },
  { flag: '--bcc <address...>', description: 'BCC recipient(s)', type: 'mixed', configurable: true },
  { flag: '--attach-file <filename...>', description: 'Attachment filename(s)', type: 'mixed', configurable: true },
  { flag: '--attach-path <path...>', description: 'Attachment path(s) - paired with --attach-file', type: 'mixed', configurable: true },
  { flag: '--attach-cid <cid...>', description: 'Content ID(s) for inline images (for <img src="cid:...">', type: 'mixed', configurable: true },
  { flag: '--attach-content-disp <value...>', description: 'Content disposition(s): inline or attachment (default: attachment)', type: 'mixed', configurable: true },
  { flag: '--email-list <listName>', description: 'Email list for bulk sending (from lists/<listName>.json)', type: 'repetitive', configurable: true },
  { flag: '--send-all', description: 'Send one email to all contacts on the list (requires --email-list or emailList/email-list in email.json)', type: 'configurable', configurable: true },
  // Tool options
  { flag: '--new-list <listName>', description: 'Create a new email list from tool files __sendEmail__<name>-emails.txt and __sendEmail__<name>-names.txt', type: 'aggressive', configurable: false, isTool: true },
  { flag: '--list-tool-path <path>', description: 'Path to tool files for --new-list (default: CWD)', type: 'passive', configurable: false, isTool: true },
];

const ARGUMENTS = [
  { name: 'account', description: 'File name of a configured account in config/accounts/', configurable: false, requires: '--account' },
  { name: 'configured email', description: 'Folder name of a configured email in config/emails/', configurable: false, requires: '--config-email' },
  { name: 'section', description: 'Help section: options | options:configurable | options:non-configurable | options:tool | arguments | arguments:configurable | arguments:non-configurable', configurable: false, requires: '-h, --help' },
  { name: 'unit test', description: 'Name of a specific unit test to run', configurable: false, requires: '--test' },
  { name: 'path', description: 'Path to copy sendEmail tool to', configurable: false, requires: '-c, --copy' },
  { name: 'address', description: 'Email address for raw text send', configurable: false, requires: '-t, --text' },
  { name: 'message', description: 'Message text for raw text send', configurable: false, requires: '-t, --text' },
  { name: 'send to', description: 'Email address to send message to', configurable: true, requires: '--send-to' },
  { name: 'message file', description: 'File path for email content', configurable: true, requires: '--message-file | --message-html | --message-text' },
  { name: 'message header', description: 'Subject line for the email', configurable: true, requires: '--subject' },
  { name: 'from address', description: 'From address override', configurable: true, requires: '--from-address' },
  { name: 'reply to', description: 'Reply-to address', configurable: true, requires: '--reply-to' },
];

/**
 * Print help for a given section (or full help if no section).
 */
export function printHelp(section?: string): void {
  if (!section) {
    printFullHelp();
    return;
  }

  switch (section.toLowerCase()) {
    case 'options':
      printOptionsHelp(OPTIONS);
      break;
    case 'options:configurable':
      printOptionsHelp(OPTIONS.filter(o => o.configurable && !o.isTool));
      break;
    case 'options:non-configurable':
      printOptionsHelp(OPTIONS.filter(o => !o.configurable && !o.isTool));
      break;
    case 'options:tool':
      printOptionsHelp(OPTIONS.filter(o => o.isTool));
      break;
    case 'arguments':
      printArgumentsHelp(ARGUMENTS);
      break;
    case 'arguments:configurable':
      printArgumentsHelp(ARGUMENTS.filter(a => a.configurable));
      break;
    case 'arguments:non-configurable':
      printArgumentsHelp(ARGUMENTS.filter(a => !a.configurable));
      break;
    default:
      console.error(chalk.red(`Unknown help section: '${section}'`));
      console.log(`Valid sections: options, options:configurable, options:non-configurable, options:tool, arguments, arguments:configurable, arguments:non-configurable`);
      process.exit(1);
  }
}

function printFullHelp(): void {
  console.log();
  console.log(chalk.bold(TOOL_NAME));
  console.log();
  console.log('Command-line tool to send an email, or automate repetitive emails.');
  console.log();
  console.log(chalk.bold('Usage:'));
  console.log(`  ${TOOL_NAME} [options] [arguments]`);
  console.log();
  console.log(chalk.bold('Examples:'));
  console.log(`  ${TOOL_NAME} -t someone@example.com "Quick message"`);
  console.log(`  ${TOOL_NAME} --send-to john@example.com --subject "Hello" --message-file message.html`);
  console.log(`  ${TOOL_NAME} --config-email billing --send-to client@example.com`);
  console.log(`  ${TOOL_NAME} --config-email newsletter --email-list subscribers --force`);
  console.log(`  ${TOOL_NAME} --config-email billing --email-list clients --send-all --force`);
  console.log();

  console.log(chalk.bold('Non-configurable Options:'));
  printOptionsHelp(OPTIONS.filter(o => !o.configurable && !o.isTool), false);

  console.log(chalk.bold('Configurable Options:'));
  printOptionsHelp(OPTIONS.filter(o => o.configurable), false);

  console.log(chalk.bold('Tool Options:'));
  printOptionsHelp(OPTIONS.filter(o => o.isTool), false);

  console.log(chalk.bold('Help Sections:'));
  console.log(`  ${TOOL_NAME} -h options               All options`);
  console.log(`  ${TOOL_NAME} -h options:configurable  Configurable options only`);
  console.log(`  ${TOOL_NAME} -h options:tool          Tool options only`);
  console.log(`  ${TOOL_NAME} -h arguments             All arguments`);
  console.log();
}

function printOptionsHelp(options: OptionEntry[], header = true): void {
  if (header) {
    console.log();
    console.log(chalk.bold('Options:'));
  }

  const flagWidth = Math.max(...options.map(o => o.flag.length), 30);

  for (const opt of options) {
    const flag = opt.flag.padEnd(flagWidth + 2);
    console.log(`  ${chalk.cyan(flag)}${opt.description}`);
    console.log(`  ${' '.repeat(flagWidth + 2)}${chalk.gray(`[type:${opt.type}]`)}`);
    console.log();
  }
}

function printArgumentsHelp(args: typeof ARGUMENTS, header = true): void {
  if (header) {
    console.log();
    console.log(chalk.bold('Arguments:'));
  }

  const nameWidth = Math.max(...args.map(a => a.name.length), 20);

  for (const arg of args) {
    const name = arg.name.padEnd(nameWidth + 2);
    console.log(`  ${chalk.cyan(name)}${arg.description}`);
    console.log(`  ${' '.repeat(nameWidth + 2)}${chalk.gray(`Requires: ${arg.requires}`)}`);
    console.log();
  }
}
