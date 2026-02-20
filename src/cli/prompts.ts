/**
 * prompts.ts
 * User confirmation and input prompts using inquirer.
 * These are shown before sending to allow the user to review and confirm.
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import type { EmailMessage } from '../core/types.js';

/**
 * Show a preview of the email message and prompt for confirmation.
 * Returns true if the user confirms, false if they cancel.
 * If force=true, skips the prompt and returns true immediately.
 */
export async function confirmSend(message: EmailMessage, force = false): Promise<boolean> {
  if (force) return true;

  // Display email preview
  console.log();
  console.log(chalk.bold('Email Preview:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`  ${chalk.cyan('To:     ')} ${formatAddresses(message.to)}`);
  if (message.cc) console.log(`  ${chalk.cyan('CC:     ')} ${formatAddresses(message.cc)}`);
  if (message.bcc) console.log(`  ${chalk.cyan('BCC:    ')} ${formatAddresses(message.bcc)}`);
  console.log(`  ${chalk.cyan('From:   ')} ${message.from}`);
  if (message.replyTo) console.log(`  ${chalk.cyan('ReplyTo:')} ${formatAddresses(message.replyTo)}`);
  console.log(`  ${chalk.cyan('Subject:')} ${message.subject}`);

  if (message.attachments && message.attachments.length > 0) {
    console.log(`  ${chalk.cyan('Attachments:')}`);
    message.attachments.forEach(att => {
      console.log(`    - ${att.filename} (${att.path})`);
    });
  }

  const bodyPreview = (message.html ?? message.text ?? '').slice(0, 200);
  if (bodyPreview) {
    console.log(`  ${chalk.cyan('Body:   ')} ${bodyPreview.replace(/\n/g, ' ')}${bodyPreview.length >= 200 ? '...' : ''}`);
  }

  console.log(chalk.gray('─'.repeat(50)));
  console.log();

  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Send this email?',
      default: false,
    },
  ]);

  return confirmed;
}

/**
 * Prompt for confirmation before sending a bulk email.
 * Shows list info and count before confirming.
 */
export async function confirmBulkSend(
  listName: string,
  count: number,
  force = false
): Promise<boolean> {
  if (force) return true;

  console.log();
  console.log(chalk.bold('Bulk Send Preview:'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(`  ${chalk.cyan('List:    ')} ${listName}`);
  console.log(`  ${chalk.cyan('Count:   ')} ${count} recipients`);
  console.log(chalk.gray('─'.repeat(50)));
  console.log();
  console.log(chalk.yellow(`⚠  This will send ${count} emails.`));
  console.log();

  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Send to all ${count} recipients?`,
      default: false,
    },
  ]);

  return confirmed;
}

/**
 * Format one or more email addresses for display.
 */
function formatAddresses(addresses: string | string[]): string {
  return Array.isArray(addresses) ? addresses.join(', ') : addresses;
}
