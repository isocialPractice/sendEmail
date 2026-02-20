/**
 * template-engine.ts
 * Template variable substitution for email content.
 * Supports both new-style {{variable}} and legacy CH-* placeholders.
 */

import type { TemplateVariables, EmailContact } from './types.js';

/**
 * Map of legacy placeholder names to new-style variable paths.
 * These are the old CH-* and CHANGE_* placeholders found in the codebase.
 */
const LEGACY_PLACEHOLDER_MAP: Record<string, string> = {
  'CH-EMAILONLIST': 'contact.name',
  'CHANGE_SEND_TO': 'contact.email',
  'CHANGE_BCC': 'bcc',
  'CHANGE_MESSAGE_HEADER': 'subject',
  'CH-EMAILTEXT': 'message',
  'CH-EMAILTO': 'contact.email',
  'CH-SUBJECT': 'subject',
  'CH-DATE': 'date',
};

export class TemplateEngine {
  // Matches {{variable.path}} or {{variable}}
  private readonly NEW_STYLE = /\{\{([^}]+)\}\}/g;

  /**
   * Substitute template variables in a string.
   * Processes both {{new.style}} and legacy CH-* placeholders.
   */
  substitute(template: string, variables: TemplateVariables): string {
    let result = template;

    // Process new-style placeholders: {{variable}}
    result = result.replace(this.NEW_STYLE, (match, key: string) => {
      const trimmed = key.trim();
      const value = variables[trimmed];
      return value !== undefined ? String(value) : match;
    });

    // Process legacy placeholders (exact string replacement)
    for (const [placeholder, varPath] of Object.entries(LEGACY_PLACEHOLDER_MAP)) {
      const value = variables[varPath];
      if (value !== undefined && result.includes(placeholder)) {
        result = result.split(placeholder).join(String(value));
      }
    }

    return result;
  }

  /**
   * Build template variables from an email contact, list metadata, and global values.
   */
  buildContactVars(
    contact: EmailContact,
    index: number,
    total: number,
    extra: Partial<TemplateVariables> = {}
  ): TemplateVariables {
    const now = new Date();

    const contactVars: TemplateVariables = {
      // New-style contact variables
      'contact.name': contact.name,
      'contact.email': contact.email,
      // Legacy: direct mapping
      'CH-EMAILONLIST': contact.name,
      'CHANGE_SEND_TO': contact.email,
    };

    // Add all custom contact fields as contact.<key>
    for (const [key, val] of Object.entries(contact)) {
      if (val !== undefined) {
        contactVars[`contact.${key}`] = val as string | number | boolean;
      }
    }

    return {
      ...contactVars,
      'date': now.toISOString().split('T')[0],
      'date.formatted': now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      'date.short': now.toLocaleDateString('en-US'),
      'list.index': index,
      'list.count': total,
      ...extra,
    };
  }

  /**
   * Build template variables for a non-list email (normal mode).
   */
  buildSingleVars(
    to: string,
    subject?: string,
    extra: Partial<TemplateVariables> = {}
  ): TemplateVariables {
    const now = new Date();

    return {
      'contact.email': to,
      'CHANGE_SEND_TO': to,
      'subject': subject ?? '',
      'CHANGE_MESSAGE_HEADER': subject ?? '',
      'date': now.toISOString().split('T')[0],
      'date.formatted': now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      'date.short': now.toLocaleDateString('en-US'),
      ...extra,
    };
  }
}
