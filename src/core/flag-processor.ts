/**
 * flag-processor.ts
 *
 * Resolves the `_flag` directive syntax used inside `config/emails/<name>/email.json`
 * against values supplied on the command line via `--template <key> <value> ...`.
 *
 * Supported directive forms (case-sensitive, the leading `_flag` token is required):
 *
 *   "_flag"                       → optional, defaults to empty string when not provided
 *   "_flag.required"              → must be provided via --template or an existing CLI
 *                                   override (e.g. --send-to for the "to" property);
 *                                   throws ConfigurationError if missing.
 *   "_flag.optional"              → optional; property is removed from the email
 *                                   config when no value is provided.
 *   "_flag:default-to=<value>"    → optional; falls back to <value> when not provided.
 *   "_flag:map-to=<otherKey>"     → resolved value is also exposed under
 *                                   `_flag.<otherKey>` in addition to `_flag.<key>`
 *                                   for HTML template substitution.
 *
 * Modifiers may be combined, e.g. "_flag.optional:map-to=salutation".
 *
 * Resolved values become available in two places:
 *   1. As real properties on the EmailConfig (so the engine treats them as it
 *      always has — e.g. a resolved "to" populates the recipient).
 *   2. As template variables keyed `_flag.<property>` for use in any HTML/text
 *      body, e.g. `{{ _flag.msg_1 }}`.
 */

import { ConfigurationError } from '../utils/error-handler.js';
import type { EmailConfig } from './types.js';

const FLAG_PREFIX = '_flag';

export interface FlagSpec {
  required: boolean;
  optional: boolean;
  /**
   * True when the directive is `_flag.condition` — declares the property is
   * evaluated by a `{% _flag.condition('<key>') %}` block in the HTML/text
   * body. Resolution behavior matches a plain `_flag` (optional, empty fallback);
   * the condition block in the body decides the rendered output.
   */
  condition: boolean;
  defaultTo?: string;
  mapTo?: string;
  raw: string;
}

export interface FlagProcessingResult {
  /** Map of `_flag.<key>` → value, suitable for merging into TemplateVariables. */
  flagVars: Record<string, string>;
  /** Properties that should be removed from the EmailConfig entirely. */
  removed: string[];
}

/**
 * Convert the variadic `--template` argument list into a key/value map.
 * Throws if an odd number of args is supplied.
 */
export function parseTemplatePairs(args: string[] | undefined): Record<string, string> {
  if (!args || args.length === 0) return {};
  if (args.length % 2 !== 0) {
    throw new ConfigurationError(
      '--template requires an even number of arguments',
      [`Got ${args.length} argument(s): ${args.join(' ')}`],
      'Pass key/value pairs, e.g. --template msg_1 "Hello" msg_2 "World"'
    );
  }
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    out[args[i]!] = args[i + 1]!;
  }
  return out;
}

/** Returns true when `value` is a string that begins with the `_flag` directive token. */
export function isFlagDirective(value: unknown): value is string {
  return typeof value === 'string' && /^_flag(\b|\.|:|$)/.test(value);
}

/** Parse a `_flag` directive string into its constituent modifiers. */
export function parseFlagSpec(raw: string): FlagSpec {
  const spec: FlagSpec = { required: false, optional: false, condition: false, raw };
  const body = raw.slice(FLAG_PREFIX.length);

  const dotMatch = body.match(/^\.([a-zA-Z][\w-]*)/);
  if (dotMatch) {
    if (dotMatch[1] === 'required') spec.required = true;
    else if (dotMatch[1] === 'optional') spec.optional = true;
    else if (dotMatch[1] === 'condition') spec.condition = true;
    // other dot keywords are reserved for future use and ignored
  }

  const defaultMatch = body.match(/:default-to=([^\s,]+)/);
  if (defaultMatch) spec.defaultTo = defaultMatch[1];

  const mapMatch = body.match(/:map-to=([^\s,]+)/);
  if (mapMatch) spec.mapTo = mapMatch[1];

  return spec;
}

/**
 * Resolve every `_flag` directive declared in `emailConfig` against the values
 * supplied via `--template` and any existing CLI overrides.
 *
 * Mutates `emailConfig` in place:
 *   - Properties with a resolved value have that string assigned.
 *   - Properties marked `_flag.optional` with no value are deleted.
 *   - Unresolved non-required directives are deleted (engine override may still
 *     supply them).
 *
 * Returns the set of resolved values to merge into TemplateVariables under the
 * `_flag.<key>` namespace.
 *
 * Throws ConfigurationError listing every `_flag.required` property that could
 * not be satisfied.
 */
export function processFlagDirectives(
  emailConfig: EmailConfig,
  templateMap: Record<string, string>,
  cliOverrides: Partial<EmailConfig> & Record<string, unknown> = {}
): FlagProcessingResult {
  const flagVars: Record<string, string> = {};
  const removed: string[] = [];
  const missing: string[] = [];

  const cfg = emailConfig as Record<string, unknown>;

  for (const key of Object.keys(cfg)) {
    const raw = cfg[key];
    if (!isFlagDirective(raw)) continue;

    const spec = parseFlagSpec(raw);

    let value: string | undefined = templateMap[key];

    // Fall back to a same-named CLI override (e.g. --send-to fills `to`).
    if (value === undefined) {
      const override = cliOverrides[key];
      if (typeof override === 'string' && override.length > 0) {
        value = override;
      } else if (Array.isArray(override) && override.length > 0 && typeof override[0] === 'string') {
        value = override[0];
      }
    }

    // Fall back to :default-to=
    if (value === undefined && spec.defaultTo !== undefined) {
      value = spec.defaultTo;
    }

    if (value === undefined) {
      if (spec.required) {
        missing.push(key);
        continue;
      }
      if (spec.optional) {
        delete cfg[key];
        removed.push(key);
        continue;
      }
      // Plain _flag → empty string fallback so HTML substitution yields ''.
      delete cfg[key];
      flagVars[`${FLAG_PREFIX}.${key}`] = '';
      if (spec.mapTo) flagVars[`${FLAG_PREFIX}.${spec.mapTo}`] = '';
      continue;
    }

    cfg[key] = value;
    flagVars[`${FLAG_PREFIX}.${key}`] = value;
    if (spec.mapTo) flagVars[`${FLAG_PREFIX}.${spec.mapTo}`] = value;

    // Condition directives are pure body inputs — the property itself is not
    // a real EmailConfig field, so strip it after exposing the flag variable.
    if (spec.condition) {
      delete cfg[key];
      removed.push(key);
    }
  }

  if (missing.length > 0) {
    const example = missing.map(k => `${k} "<value>"`).join(' ');
    throw new ConfigurationError(
      `Missing required --template value(s): ${missing.join(', ')}`,
      missing.map(k => `Property '${k}' in email.json is marked _flag.required and no value was supplied via --template or an equivalent CLI option.`),
      `Provide all required values: --template ${example}`
    );
  }

  return { flagVars, removed };
}
