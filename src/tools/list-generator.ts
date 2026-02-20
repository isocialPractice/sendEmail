/**
 * list-generator.ts
 * Generates email lists from tool files.
 * Tool files: __sendEmail__<listName>-emails.txt and __sendEmail__<listName>-names.txt
 */

import path from 'path';
import { readFile, writeFile, exists } from '../utils/file-utils.js';
import { info, success, warn } from '../utils/logger.js';
import { FileError, ValidationError } from '../utils/error-handler.js';
import type { EmailList, EmailContact } from '../core/types.js';

export class ListGenerator {
  constructor(private rootPath: string) {}

  /**
   * Generate an email list JSON from two tool files.
   * @param listName - name for the output list
   * @param toolPath - directory containing the tool files
   * @param outputPath - path to write the JSON list
   */
  async generate(
    listName: string,
    toolPath: string,
    outputPath: string
  ): Promise<void> {
    const emailsFile = path.resolve(toolPath, `__sendEmail__${listName}-emails.txt`);
    const namesFile = path.resolve(toolPath, `__sendEmail__${listName}-names.txt`);

    if (!(await exists(emailsFile))) {
      throw new FileError(
        `Email tool file not found: ${emailsFile}`,
        [`Expected: __sendEmail__${listName}-emails.txt in ${toolPath}`],
        `Create a file named __sendEmail__${listName}-emails.txt with one email per line.`
      );
    }

    if (!(await exists(namesFile))) {
      throw new FileError(
        `Names tool file not found: ${namesFile}`,
        [`Expected: __sendEmail__${listName}-names.txt in ${toolPath}`],
        `Create a file named __sendEmail__${listName}-names.txt with one name per line.`
      );
    }

    info(`Reading email tool files...`);

    const emailsContent = await readFile(emailsFile);
    const namesContent = await readFile(namesFile);

    const emails = parseToolFile(emailsContent);
    const names = parseToolFile(namesContent);

    if (emails.length !== names.length) {
      throw new ValidationError(
        'Email and names files have different line counts',
        [
          `Emails: ${emails.length} lines`,
          `Names: ${names.length} lines`,
          `Files must have the same number of entries (one per line).`,
        ]
      );
    }

    const contacts: EmailContact[] = emails.map((email, i) => ({
      email: email.trim(),
      name: names[i]!.trim(),
    }));

    // Validate emails
    const invalid = contacts.filter(c => !c.email.includes('@'));
    if (invalid.length > 0) {
      const invalidList = invalid.map(c => c.email);
      warn(`Found ${invalid.length} potentially invalid email address(es):\n  ${invalidList.join('\n  ')}`);
    }

    const emailList: EmailList = { 'email-list': contacts };

    await writeFile(outputPath, JSON.stringify(emailList, null, 2));

    success(`Created email list '${listName}' with ${contacts.length} contacts:`);
    info(`  Output: ${outputPath}`);
  }
}

/**
 * Parse a tool file: one entry per line, skip empty lines and comments.
 */
function parseToolFile(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}
