/**
 * template-engine.ts
 * Template variable substitution for email content.
 * Supports both new-style {{variable}} and legacy CH-* placeholders.
 */

import type { TemplateVariables, EmailContact } from './types.js';
import { buildDatesVars } from '../utils/dates-helper.js';

/**
 * One case in a `_flag.condition` block. Used internally by TemplateEngine.
 */
interface ConditionCase {
  match: 'undefined' | 'flagged' | 'else' | 'equal';
  equalValue?: string;
  message?: string;
  subCases?: ConditionCase[];
}

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
   * Matches {% global 'name' %} tags in HTML content.
   * Supports plain names ('footer') and nested paths ('footer/billing').
   * Single or double quotes are both accepted.
   */
  private readonly GLOBAL_TAG = /\{%\s*global\s+['"]([^'"]+)['"]\s*%\}/g;

  /**
   * Matches a {% _flag.condition('<key>') %} ... {% end %} block.
   * Capture 1: the condition key (the alias being evaluated, typically a `map-to` target).
   * Capture 2: the block body (pseudo-YAML cases).
   */
  private readonly FLAG_CONDITION = /\{%\s*_flag\.condition\(\s*['"]([^'"]+)['"]\s*\)\s*%\}([\s\S]*?)\{%\s*end\s*%\}/g;

  /**
   * Matches an inline {% _flag 'key' %} substitution tag.
   * Capture 1: the flag key (looked up in template vars as `_flag.<key>`).
   */
  private readonly FLAG_INLINE = /\{%\s*_flag\s+['"]([^'"]+)['"]\s*%\}/g;

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

    // Build dates.* variables from @jhauga/getdate
    const datesVars = buildDatesVars();

    return {
      ...contactVars,
      ...datesVars,
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

    // Build dates.* variables from @jhauga/getdate
    const datesVars = buildDatesVars();

    return {
      ...datesVars,
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

  /**
   * Extract all unique global names referenced by {% global 'name' %} tags.
   * Returns deduplicated list in order of first appearance.
   */
  extractGlobalTags(template: string): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    const regex = new RegExp(this.GLOBAL_TAG.source, 'g');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(template)) !== null) {
      const name = match[1].trim();
      if (!seen.has(name)) {
        seen.add(name);
        result.push(name);
      }
    }
    return result;
  }

  /**
   * Replace {% global 'name' %} tags in an HTML string with resolved content.
   *
   * @param template        The HTML string containing global tags
   * @param globalContentMap  Map of global name → replacement HTML string
   * @returns The HTML string with all resolved global tags substituted
   *
   * If a global name is not found in the map, the tag is replaced with an
   * empty string and a warning is expected to have been issued by the caller.
   */
  processGlobalTags(template: string, globalContentMap: Map<string, string>): string {
    return template.replace(
      new RegExp(this.GLOBAL_TAG.source, 'g'),
      (_match, name: string) => globalContentMap.get(name.trim()) ?? ''
    );
  }

  /**
   * Process `{% _flag.condition('<key>') %} ... {% end %}` blocks and inline
   * `{% _flag 'name' %}` substitution tags.
   *
   * Condition blocks are evaluated against the `_flag.<key>` value in `vars`
   * and replaced by the selected `message:` line. After all condition blocks
   * are resolved, any remaining `{% _flag 'name' %}` tags (e.g. standalone
   * usages outside a condition) are substituted with `_flag.<name>`.
   *
   * Tags whose referenced variable is missing are replaced with the empty
   * string (matching how `_flag` plain directives resolve when no value is
   * supplied).
   */
  processFlagConditions(template: string, variables: TemplateVariables): string {
    // 1. Evaluate condition blocks first.
    let result = template.replace(
      new RegExp(this.FLAG_CONDITION.source, 'g'),
      (_match, key: string, body: string) => {
        const lookupKey = `_flag.${key.trim()}`;
        const rawValue = variables[lookupKey];
        const value = rawValue === undefined || rawValue === null ? '' : String(rawValue);
        const cases = this.parseConditionBody(body);
        const message = this.evaluateConditionCases(cases, value);
        return message;
      }
    );

    // 2. Substitute any remaining inline {% _flag 'name' %} tags.
    result = result.replace(
      new RegExp(this.FLAG_INLINE.source, 'g'),
      (_match, name: string) => {
        const v = variables[`_flag.${name.trim()}`];
        return v === undefined || v === null ? '' : String(v);
      }
    );

    return result;
  }

  /**
   * Parse the pseudo-YAML body of a `_flag.condition` block into an ordered
   * list of cases. The grammar is intentionally lenient — comments and blank
   * lines are ignored. See `docs/TEMPLATING.md` for the full reference.
   */
  private parseConditionBody(body: string): ConditionCase[] {
    const cases: ConditionCase[] = [];
    let topIndent: number | null = null;
    let curTop: ConditionCase | null = null;
    let curSub: ConditionCase | null = null;

    const lines = body.split(/\r?\n/);

    for (const rawLine of lines) {
      if (!rawLine.trim()) continue;
      const indentMatch = rawLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1].length : 0;
      const content = rawLine.trim();

      // Case opener: line starts with `-`.
      const openerMatch = content.match(/^-\s*(.*)$/);
      if (openerMatch) {
        const header = openerMatch[1].trim();
        const parsed = this.parseConditionHeader(header);
        if (!parsed) continue;

        const isSubCase =
          topIndent !== null &&
          indent > topIndent &&
          curTop !== null &&
          curTop.match === 'flagged';

        if (isSubCase) {
          curTop!.subCases = curTop!.subCases ?? [];
          curTop!.subCases.push(parsed);
          curSub = parsed;
        } else {
          cases.push(parsed);
          curTop = parsed;
          curSub = null;
          if (topIndent === null) topIndent = indent;
        }
        continue;
      }

      // `message:` value belongs to the most recent case (sub if active).
      const msgMatch = content.match(/^message\s*:\s*(.*)$/i);
      if (msgMatch) {
        const msg = msgMatch[1];
        const target = curSub ?? curTop;
        if (target) target.message = msg;
        continue;
      }

      // `comment:` lines and unrecognized lines are ignored.
    }

    return cases;
  }

  /**
   * Parse one case header line into a structured case. Returns `null` for
   * unrecognized headers.
   */
  private parseConditionHeader(header: string): ConditionCase | null {
    // `else:` (with optional message body on the same line — ignored here).
    if (/^else\s*:/i.test(header)) {
      return { match: 'else' };
    }
    // `equal: "value"` — used inside a {flagged} parent.
    const equalMatch = header.match(/^equal\s*:\s*(.*)$/i);
    if (equalMatch) {
      const raw = equalMatch[1].trim();
      const unquoted = raw.replace(/^["']|["']$/g, '');
      return { match: 'equal', equalValue: unquoted };
    }
    // `<propName>: undefined` or `<propName>: {flagged}`
    const propMatch = header.match(/^[\w-]+\s*:\s*(.*)$/);
    if (propMatch) {
      const rhs = propMatch[1].trim();
      if (/^undefined$/i.test(rhs)) return { match: 'undefined' };
      if (/^\{flagged\}$/i.test(rhs)) return { match: 'flagged' };
    }
    return null;
  }

  /**
   * Walk the parsed cases in order and return the first matching `message:`.
   * Returns the empty string if nothing matches.
   */
  private evaluateConditionCases(cases: ConditionCase[], value: string): string {
    const hasValue = value !== '' && value !== 'undefined';

    for (const c of cases) {
      if (c.match === 'undefined') {
        if (!hasValue) return c.message ?? '';
      } else if (c.match === 'flagged') {
        if (hasValue) {
          if (c.subCases && c.subCases.length > 0) {
            let elseSub: ConditionCase | null = null;
            for (const sub of c.subCases) {
              if (sub.match === 'equal' && sub.equalValue === value) {
                return sub.message ?? '';
              }
              if (sub.match === 'else') elseSub = sub;
            }
            if (elseSub) return elseSub.message ?? '';
          }
          if (c.message !== undefined) return c.message;
        }
      } else if (c.match === 'else') {
        return c.message ?? '';
      }
    }
    return '';
  }
}
