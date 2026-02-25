/**
 * email-logger.ts
 * Sequential email send logger.
 * Each call to writeLog() creates a new numbered file in the logs/ directory:
 *   logs/1.log, logs/2.log, logs/3.log, ...
 *
 * Activated by the --log CLI flag or "log": true in email.json.
 */

import fs from 'fs/promises';
import path from 'path';
import type { EmailMessage, SendResult, BulkSendResult, CLIOptions } from '../core/types.js';

export interface LogEntry {
  /** CLIOptions passed to the invocation */
  opts: CLIOptions;
  /** Resolved email message that was sent (or attempted). May be omitted for bulk mode. */
  message?: EmailMessage;
  /** Result of a single send — use this OR bulkResult */
  sendResult?: SendResult;
  /** Result of a bulk send — use this OR sendResult */
  bulkResult?: BulkSendResult;
  /** Name of the --config-email used, if any */
  configEmail?: string;
  /** Name of the --email-list used, if any */
  emailList?: string;
}

/**
 * Scan the logs directory, find the highest sequential log number,
 * and return the next number to use.
 * Returns 1 if the directory is empty or does not exist.
 */
export async function getNextLogNumber(logsPath: string): Promise<number> {
  try {
    await fs.mkdir(logsPath, { recursive: true });
    const entries = await fs.readdir(logsPath);

    let max = 0;
    for (const entry of entries) {
      const match = /^(\d+)\.log$/.exec(entry);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > max) max = n;
      }
    }

    return max + 1;
  } catch {
    return 1;
  }
}

/**
 * Write a sequential log file for a sent (or attempted) email.
 * The log number is determined automatically by scanning existing logs.
 *
 * @param logsPath  Absolute path to the logs/ directory
 * @param entry     Log entry data
 * @returns         The absolute path of the written log file
 */
export async function writeLog(logsPath: string, entry: LogEntry): Promise<string> {
  const logNumber = await getNextLogNumber(logsPath);
  const filePath = path.join(logsPath, `${logNumber}.log`);
  const content = formatLogEntry(logNumber, entry);

  await fs.mkdir(logsPath, { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');

  return filePath;
}

/**
 * Determine whether logging is enabled from CLI opts and/or email config.
 * Accepts boolean true or the string "true" from email.json.
 */
export function isLogEnabled(
  opts: CLIOptions,
  emailConfigLog?: boolean | string
): boolean {
  if (opts.log === true) return true;
  if (emailConfigLog === true) return true;
  if (typeof emailConfigLog === 'string' && emailConfigLog.toLowerCase() === 'true') return true;
  return false;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

function formatLogEntry(logNumber: number, entry: LogEntry): string {
  const { opts, message, sendResult, bulkResult, configEmail, emailList } = entry;
  const now = new Date();
  const lines: string[] = [];

  lines.push('sendEmail Log');
  lines.push('=============');
  lines.push(`Log #:      ${logNumber}`);
  lines.push(`Timestamp:  ${now.toISOString()}`);
  lines.push(`Date:       ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push('');

  // ── Send Configuration ────────────────────────────────────────────────────
  if (message) {
    lines.push('[ Send Configuration ]');
    lines.push(`From:       ${message.from}`);
    lines.push(`To:         ${formatAddresses(message.to)}`);
    if (message.cc)      lines.push(`CC:         ${formatAddresses(message.cc)}`);
    if (message.bcc)     lines.push(`BCC:        ${formatAddresses(message.bcc)}`);
    if (message.replyTo) lines.push(`Reply-To:   ${formatAddresses(message.replyTo)}`);
    lines.push(`Subject:    ${message.subject}`);
    if (configEmail) lines.push(`Config:     --config-email ${configEmail}`);
    if (emailList)   lines.push(`List:       --email-list ${emailList}`);
    if (opts.account) lines.push(`Account:    --account ${opts.account}`);
  } else {
    lines.push('[ Send Configuration ]');
    if (configEmail) lines.push(`Config:     --config-email ${configEmail}`);
    if (emailList)   lines.push(`List:       --email-list ${emailList}`);
    if (opts.account) lines.push(`Account:    --account ${opts.account}`);
  }
  lines.push('');

  // ── Result ────────────────────────────────────────────────────────────────
  lines.push('[ Result ]');
  if (sendResult) {
    lines.push(`Success:    ${sendResult.success}`);
    if (sendResult.messageId)  lines.push(`Message-ID: ${sendResult.messageId}`);
    if (sendResult.recipient)  lines.push(`Recipient:  ${sendResult.recipient}`);
    if (sendResult.error)      lines.push(`Error:      ${sendResult.error.message}`);
  } else if (bulkResult) {
    lines.push(`Total:      ${bulkResult.total}`);
    lines.push(`Sent:       ${bulkResult.successful}`);
    lines.push(`Failed:     ${bulkResult.failed}`);
    lines.push('');
    lines.push('[ Recipients ]');
    for (const r of bulkResult.results) {
      const status = r.success ? 'OK ' : 'ERR';
      const id = r.messageId ? ` (${r.messageId})` : '';
      const errMsg = r.error ? ` — ${r.error.message}` : '';
      lines.push(`  [${status}] ${r.recipient ?? '?'}${id}${errMsg}`);
    }
  }
  lines.push('');

  // ── Attachments ───────────────────────────────────────────────────────────
  if (message?.attachments && message.attachments.length > 0) {
    lines.push('[ Attachments ]');
    for (const att of message.attachments) {
      const disp = att.contentDisposition ? ` (${att.contentDisposition})` : '';
      const cid  = att.cid ? ` cid:${att.cid}` : '';
      lines.push(`  ${att.filename}${disp}${cid}  →  ${att.path}`);
    }
    lines.push('');
  }

  // ── CLI Options ───────────────────────────────────────────────────────────
  lines.push('[ CLI Options ]');
  const optEntries = buildOptionsLines(opts);
  if (optEntries.length > 0) {
    lines.push(...optEntries);
  } else {
    lines.push('  (none)');
  }
  lines.push('');

  return lines.join('\n');
}

function formatAddresses(addr: string | string[]): string {
  return Array.isArray(addr) ? addr.join(', ') : addr;
}

function buildOptionsLines(opts: CLIOptions): string[] {
  const lines: string[] = [];

  const record: Record<string, unknown> = {
    account:           opts.account,
    configEmail:       opts.configEmail,
    sendTo:            opts.sendTo,
    subject:           opts.subject,
    messageFile:       opts.messageFile,
    messageHtml:       opts.messageHtml,
    messageText:       opts.messageText,
    fromAddress:       opts.fromAddress,
    replyTo:           opts.replyTo,
    cc:                opts.cc,
    bcc:               opts.bcc,
    attachFile:        opts.attachFile,
    attachPath:        opts.attachPath,
    attachCid:         opts.attachCid,
    attachContentDisp: opts.attachContentDisp,
    emailList:         opts.emailList,
    sendAll:           opts.sendAll,
    force:             opts.force,
    log:               opts.log,
    globalConfig:      opts.globalConfig,
    globalConfigRoot:  opts.globalConfigRoot,
    globalConfigPath:  opts.globalConfigPath,
  };

  for (const [key, val] of Object.entries(record)) {
    if (val === undefined || val === null) continue;
    const display = Array.isArray(val) ? val.join(', ') : String(val);
    lines.push(`  ${key}: ${display}`);
  }

  return lines;
}
