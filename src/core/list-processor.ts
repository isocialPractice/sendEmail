/**
 * list-processor.ts
 * Iterates through an email list for bulk/repetitive sending.
 * Provides progress tracking and per-contact template variable building.
 */

import type { EmailList, EmailContact, TemplateVariables } from './types.js';
import { TemplateEngine } from './template-engine.js';
import { ValidationError } from '../utils/error-handler.js';

export interface ListProcessResult {
  contact: EmailContact;
  variables: TemplateVariables;
  index: number;
  total: number;
}

export class ListProcessor {
  private templateEngine = new TemplateEngine();

  /**
   * Validate an email list and return contacts.
   */
  validate(list: EmailList): EmailContact[] {
    const contacts = list['email-list'];

    if (!contacts || contacts.length === 0) {
      throw new ValidationError(
        'Email list is empty',
        ['The "email-list" array has no entries.'],
        'Add contacts to the list file in lists/'
      );
    }

    // Validate required fields
    const invalid: string[] = [];
    contacts.forEach((contact, i) => {
      if (!contact.email) invalid.push(`Entry ${i}: missing 'email' field`);
      if (!contact.name) invalid.push(`Entry ${i}: missing 'name' field`);
    });

    if (invalid.length > 0) {
      throw new ValidationError(
        'Email list has invalid entries',
        invalid,
        'Each entry must have at minimum: { "email": "...", "name": "..." }'
      );
    }

    return contacts;
  }

  /**
   * Process each contact in the list, yielding resolved template variables.
   * Calls onProgress callback after each contact is processed.
   */
  async *process(
    list: EmailList,
    extra: Partial<TemplateVariables> = {}
  ): AsyncGenerator<ListProcessResult> {
    const contacts = this.validate(list);
    const total = contacts.length;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]!;
      const variables = this.templateEngine.buildContactVars(contact, i, total, extra);
      yield { contact, variables, index: i, total };
    }
  }

  /**
   * Get the count of contacts in a list.
   */
  count(list: EmailList): number {
    return list['email-list']?.length ?? 0;
  }
}
