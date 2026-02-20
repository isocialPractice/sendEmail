/**
 * engine.test.ts
 * Unit tests for the EmailEngine core class.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateEngine } from '../../src/core/template-engine.js';
import { ListProcessor } from '../../src/core/list-processor.js';
import type { EmailList, EmailContact } from '../../src/core/types.js';

// ── TemplateEngine Tests ───────────────────────────────────────────────────

describe('TemplateEngine', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = new TemplateEngine();
  });

  it('substitutes new-style {{variable}} placeholders', () => {
    const result = engine.substitute(
      'Hello {{contact.name}}, your email is {{contact.email}}',
      { 'contact.name': 'John Doe', 'contact.email': 'john@example.com' }
    );
    expect(result).toBe('Hello John Doe, your email is john@example.com');
  });

  it('substitutes legacy CH-EMAILONLIST placeholder', () => {
    const result = engine.substitute(
      'Dear CH-EMAILONLIST,',
      { 'contact.name': 'Jane Doe', 'CH-EMAILONLIST': 'Jane Doe' }
    );
    expect(result).toBe('Dear Jane Doe,');
  });

  it('substitutes legacy CHANGE_SEND_TO placeholder', () => {
    const result = engine.substitute(
      'Sending to: CHANGE_SEND_TO',
      { 'contact.email': 'john@example.com', 'CHANGE_SEND_TO': 'john@example.com' }
    );
    expect(result).toBe('Sending to: john@example.com');
  });

  it('leaves unmatched placeholders unchanged', () => {
    const result = engine.substitute(
      'Hello {{unknown.var}}',
      { 'contact.name': 'John' }
    );
    expect(result).toBe('Hello {{unknown.var}}');
  });

  it('handles multiple substitutions in one string', () => {
    const result = engine.substitute(
      '{{a}} and {{b}} and {{a}}',
      { a: 'foo', b: 'bar' }
    );
    expect(result).toBe('foo and bar and foo');
  });

  it('buildContactVars creates correct variable set', () => {
    const contact: EmailContact = {
      email: 'alice@example.com',
      name: 'Alice',
      company: 'ACME',
    };
    const vars = engine.buildContactVars(contact, 0, 5);

    expect(vars['contact.name']).toBe('Alice');
    expect(vars['contact.email']).toBe('alice@example.com');
    expect(vars['contact.company']).toBe('ACME');
    expect(vars['list.index']).toBe(0);
    expect(vars['list.count']).toBe(5);
    expect(vars['CH-EMAILONLIST']).toBe('Alice');
    expect(vars['CHANGE_SEND_TO']).toBe('alice@example.com');
    expect(typeof vars['date']).toBe('string');
  });

  it('buildSingleVars creates variables for a single send', () => {
    const vars = engine.buildSingleVars('bob@example.com', 'Hello World');

    expect(vars['contact.email']).toBe('bob@example.com');
    expect(vars['subject']).toBe('Hello World');
    expect(typeof vars['date']).toBe('string');
  });
});

// ── ListProcessor Tests ────────────────────────────────────────────────────

describe('ListProcessor', () => {
  let processor: ListProcessor;

  beforeEach(() => {
    processor = new ListProcessor();
  });

  const sampleList: EmailList = {
    'email-list': [
      { email: 'alice@example.com', name: 'Alice' },
      { email: 'bob@example.com', name: 'Bob' },
      { email: 'carol@example.com', name: 'Carol' },
    ],
  };

  it('validates a valid email list without throwing', () => {
    expect(() => processor.validate(sampleList)).not.toThrow();
  });

  it('throws ValidationError for empty list', () => {
    expect(() => processor.validate({ 'email-list': [] })).toThrow('Email list is empty');
  });

  it('throws ValidationError for missing email field', () => {
    const badList: EmailList = {
      'email-list': [{ email: '', name: 'Alice' }],
    };
    expect(() => processor.validate(badList)).toThrow('Email list has invalid entries');
  });

  it('throws ValidationError for missing name field', () => {
    const badList: EmailList = {
      'email-list': [{ email: 'alice@example.com', name: '' }],
    };
    expect(() => processor.validate(badList)).toThrow('Email list has invalid entries');
  });

  it('count returns correct number of contacts', () => {
    expect(processor.count(sampleList)).toBe(3);
  });

  it('process yields correct variables for each contact', async () => {
    const results: Array<{ contact: EmailContact; index: number; total: number }> = [];

    for await (const item of processor.process(sampleList)) {
      results.push({ contact: item.contact, index: item.index, total: item.total });
    }

    expect(results).toHaveLength(3);
    expect(results[0]!.contact.name).toBe('Alice');
    expect(results[0]!.index).toBe(0);
    expect(results[0]!.total).toBe(3);
    expect(results[2]!.contact.name).toBe('Carol');
    expect(results[2]!.index).toBe(2);
  });

  it('process provides correct template variables', async () => {
    const items = [];
    for await (const item of processor.process(sampleList)) {
      items.push(item);
    }

    const first = items[0]!;
    expect(first.variables['contact.name']).toBe('Alice');
    expect(first.variables['contact.email']).toBe('alice@example.com');
    expect(first.variables['CH-EMAILONLIST']).toBe('Alice');
    expect(first.variables['CHANGE_SEND_TO']).toBe('alice@example.com');
  });
});
