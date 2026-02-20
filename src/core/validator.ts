/**
 * validator.ts
 * Input validation for email addresses, options, and configurations.
 */

import { z } from 'zod';
import { ValidationError } from '../utils/error-handler.js';
import type { CLIOptions, EmailMessage, SendMode } from './types.js';

// Email address regex pattern (RFC 5322 simplified)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a single email address.
 */
export function validateEmailAddress(address: string): void {
  if (!EMAIL_REGEX.test(address.trim())) {
    throw new ValidationError(
      `Invalid email address: '${address}'`,
      [`The address '${address}' does not appear to be valid.`],
      `Use format: user@domain.com`
    );
  }
}

/**
 * Validate one or more email addresses (string or array).
 */
export function validateEmailAddresses(addresses: string | string[]): void {
  const list = Array.isArray(addresses) ? addresses : [addresses];
  list.forEach(validateEmailAddress);
}

// Zod schema for email message validation
const EmailMessageSchema = z.object({
  from: z.string().min(1, 'From address is required'),
  to: z.union([z.string().min(1), z.array(z.string().min(1))]),
  subject: z.string().min(1, 'Subject is required'),
  cc: z.union([z.string(), z.array(z.string())]).optional(),
  bcc: z.union([z.string(), z.array(z.string())]).optional(),
  replyTo: z.union([z.string(), z.array(z.string())]).optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    path: z.string(),
  })).optional(),
}).refine(
  data => data.text !== undefined || data.html !== undefined,
  { message: 'Either text or html content is required' }
);

/**
 * Validate a complete email message before sending.
 */
export function validateEmailMessage(message: EmailMessage): void {
  const result = EmailMessageSchema.safeParse(message);

  if (!result.success) {
    const details = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    throw new ValidationError(
      'Email message validation failed',
      details,
      `Check that all required fields are present: from, to, subject, and text/html content.`
    );
  }
}

/**
 * Validate CLI options are consistent with each other.
 */
export function validateCLIOptions(opts: CLIOptions): void {
  // --send-to is required for normal mode
  if (opts.mode === ('normal' as SendMode) && !opts.sendTo && !opts.configEmail) {
    throw new ValidationError(
      'Recipient address required',
      ['No --send-to address specified and no --config-email with a "to" field.'],
      `Specify a recipient: sendEmail --send-to "someone@example.com" ...`
    );
  }

  // Email list required for repetitive mode
  if (opts.mode === ('repetitive' as SendMode) && !opts.emailList) {
    throw new ValidationError(
      'Email list required for bulk sending',
      ['--email-list is required when sending to a list.'],
      `Specify a list: sendEmail --config-email newsletter --email-list subscribers`
    );
  }

  // Validate send-to addresses if provided
  if (opts.sendTo) {
    const addresses = Array.isArray(opts.sendTo) ? opts.sendTo : [opts.sendTo];
    addresses.forEach(addr => {
      try {
        validateEmailAddress(addr);
      } catch {
        throw new ValidationError(
          `Invalid --send-to address: '${addr}'`,
          [`'${addr}' is not a valid email address.`]
        );
      }
    });
  }

  // Validate from address if provided
  if (opts.fromAddress) {
    try {
      validateEmailAddress(opts.fromAddress);
    } catch {
      throw new ValidationError(
        `Invalid --from-address: '${opts.fromAddress}'`,
        [`'${opts.fromAddress}' is not a valid email address.`]
      );
    }
  }
}

/**
 * Validate attachment content disposition value.
 */
export function validateContentDisposition(value: string): asserts value is 'attachment' | 'inline' {
  if (value !== 'attachment' && value !== 'inline') {
    throw new ValidationError(
      `Invalid --attach-content-disp value: '${value}'`,
      [`Must be 'attachment' or 'inline'.`]
    );
  }
}
