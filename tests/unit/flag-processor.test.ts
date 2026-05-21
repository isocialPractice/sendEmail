/**
 * flag-processor.test.ts
 * Unit tests for the --template / _flag directive resolver.
 */

import { describe, it, expect } from 'vitest';
import {
  parseTemplatePairs,
  isFlagDirective,
  parseFlagSpec,
  processFlagDirectives,
} from '../../src/core/flag-processor.js';
import type { EmailConfig } from '../../src/core/types.js';
import { ConfigurationError } from '../../src/utils/error-handler.js';

describe('parseTemplatePairs', () => {
  it('returns empty map for undefined / empty input', () => {
    expect(parseTemplatePairs(undefined)).toEqual({});
    expect(parseTemplatePairs([])).toEqual({});
  });

  it('parses an even number of args into key/value pairs', () => {
    expect(parseTemplatePairs(['msg_1', 'Hello', 'msg_2', 'World'])).toEqual({
      msg_1: 'Hello',
      msg_2: 'World',
    });
  });

  it('throws on an odd number of args', () => {
    expect(() => parseTemplatePairs(['msg_1'])).toThrow(ConfigurationError);
  });
});

describe('isFlagDirective', () => {
  it('detects _flag forms', () => {
    expect(isFlagDirective('_flag')).toBe(true);
    expect(isFlagDirective('_flag.required')).toBe(true);
    expect(isFlagDirective('_flag.optional')).toBe(true);
    expect(isFlagDirective('_flag:default-to=hello')).toBe(true);
    expect(isFlagDirective('_flag:map-to=salutation')).toBe(true);
  });

  it('rejects non-directive values', () => {
    expect(isFlagDirective('hello')).toBe(false);
    expect(isFlagDirective('_flagged')).toBe(false);
    expect(isFlagDirective(42)).toBe(false);
    expect(isFlagDirective(undefined)).toBe(false);
  });
});

describe('parseFlagSpec', () => {
  it('parses required / optional modifiers', () => {
    expect(parseFlagSpec('_flag.required').required).toBe(true);
    expect(parseFlagSpec('_flag.optional').optional).toBe(true);
  });

  it('parses :default-to= and :map-to=', () => {
    const spec = parseFlagSpec('_flag.optional:map-to=salutation');
    expect(spec.optional).toBe(true);
    expect(spec.mapTo).toBe('salutation');

    const spec2 = parseFlagSpec('_flag:default-to=hello@example.com');
    expect(spec2.defaultTo).toBe('hello@example.com');
  });
});

describe('processFlagDirectives', () => {
  it('writes resolved values back to emailConfig and exposes _flag.<key> vars', () => {
    const cfg: EmailConfig = {
      to: '_flag.required',
      msg_1: '_flag.required',
    } as unknown as EmailConfig;

    const result = processFlagDirectives(cfg, { to: 'alice@example.com', msg_1: 'Hello' }, {});

    expect((cfg as Record<string, unknown>).to).toBe('alice@example.com');
    expect((cfg as Record<string, unknown>).msg_1).toBe('Hello');
    expect(result.flagVars).toEqual({
      '_flag.to': 'alice@example.com',
      '_flag.msg_1': 'Hello',
    });
  });

  it('throws when a required flag is missing', () => {
    const cfg = { msg_1: '_flag.required' } as unknown as EmailConfig;
    expect(() => processFlagDirectives(cfg, {}, {})).toThrow(ConfigurationError);
  });

  it('falls back to CLI overrides for required directives', () => {
    const cfg = { to: '_flag.required' } as unknown as EmailConfig;
    const result = processFlagDirectives(cfg, {}, { to: 'bob@example.com' });
    expect((cfg as Record<string, unknown>).to).toBe('bob@example.com');
    expect(result.flagVars['_flag.to']).toBe('bob@example.com');
  });

  it('uses :default-to when no value is provided', () => {
    const cfg = { subject: '_flag:default-to=Greetings' } as unknown as EmailConfig;
    const result = processFlagDirectives(cfg, {}, {});
    expect((cfg as Record<string, unknown>).subject).toBe('Greetings');
    expect(result.flagVars['_flag.subject']).toBe('Greetings');
  });

  it('removes _flag.optional properties when not provided', () => {
    const cfg = { msg_etc: '_flag.optional' } as unknown as EmailConfig;
    const result = processFlagDirectives(cfg, {}, {});
    expect('msg_etc' in (cfg as Record<string, unknown>)).toBe(false);
    expect(result.removed).toContain('msg_etc');
  });

  it('exposes mapped alias under _flag.<mapTo>', () => {
    const cfg = { name: '_flag:map-to=salutation' } as unknown as EmailConfig;
    processFlagDirectives(cfg, { name: 'Alice' }, {});
    const result = processFlagDirectives(
      { name: '_flag:map-to=salutation' } as unknown as EmailConfig,
      { name: 'Alice' },
      {}
    );
    expect(result.flagVars['_flag.name']).toBe('Alice');
    expect(result.flagVars['_flag.salutation']).toBe('Alice');
  });

  it('leaves non-flag values untouched', () => {
    const cfg = { from: '_default', subject: 'static' } as unknown as EmailConfig;
    processFlagDirectives(cfg, {}, {});
    expect((cfg as Record<string, unknown>).from).toBe('_default');
    expect((cfg as Record<string, unknown>).subject).toBe('static');
  });
});
