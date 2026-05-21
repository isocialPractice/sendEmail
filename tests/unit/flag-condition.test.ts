/**
 * flag-condition.test.ts
 * Unit tests for `{% _flag.condition('<key>') %} ... {% end %}` blocks and
 * the inline `{% _flag 'name' %}` substitution tag.
 */

import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../../src/core/template-engine.js';

const engine = new TemplateEngine();

function trim(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

describe('processFlagConditions — html-else example', () => {
  const template = [
    "{% _flag.condition('salutation') %}",
    ' - name: undefined',
    '     message: <p>Hello,</p>',
    ' - else:',
    "     message: <p>Hey {% _flag 'name' %},</p>",
    '{% end %}',
    '',
    '<p>{{ _flag.msg }}</p>',
  ].join('\n');

  it('renders the else branch when the condition key is set (command one)', () => {
    const vars = { '_flag.name': 'Jim', '_flag.salutation': 'Jim', '_flag.msg': 'It worked' };
    const out = engine.processFlagConditions(template, vars);
    // After processFlagConditions, {% _flag 'name' %} is substituted; {{ }} is not.
    expect(out).toContain('<p>Hey Jim,</p>');
    expect(out).not.toContain("{% _flag");
    // {{ _flag.msg }} is left for the next substitute() pass.
    expect(out).toContain('{{ _flag.msg }}');
  });

  it('renders the undefined branch when the condition key has no value (command two)', () => {
    const vars = { '_flag.name': '', '_flag.salutation': '', '_flag.msg': '' };
    const out = engine.processFlagConditions(template, vars);
    expect(out).toContain('<p>Hello,</p>');
    expect(out).not.toContain('Hey');
  });
});

describe('processFlagConditions — html-else-if example with nested equal cases', () => {
  const template = [
    "{% _flag.condition('salutation') %}",
    ' - name: undefined',
    '     message: <p>Hello,</p>',
    ' - name: {flagged}',
    '     - equal: "Copilot"',
    "         message: <p>Howdy {% _flag 'name' %},</p>",
    '     - else:',
    "         message: <p>Hey {% _flag 'name' %},</p>",
    '{% end %}',
  ].join('\n');

  it('falls through to the flagged-else branch on any non-matching value (command one)', () => {
    const vars = { '_flag.name': 'Jim', '_flag.salutation': 'Jim' };
    const out = engine.processFlagConditions(template, vars);
    expect(trim(out)).toBe('<p>Hey Jim,</p>');
  });

  it('renders undefined when condition key is empty (command two)', () => {
    const vars = { '_flag.name': '', '_flag.salutation': '' };
    const out = engine.processFlagConditions(template, vars);
    expect(trim(out)).toBe('<p>Hello,</p>');
  });

  it('matches the nested equal: "Copilot" branch (command three)', () => {
    const vars = { '_flag.name': 'Copilot', '_flag.salutation': 'Copilot' };
    const out = engine.processFlagConditions(template, vars);
    expect(trim(out)).toBe('<p>Howdy Copilot,</p>');
  });
});

describe('inline {% _flag \'name\' %} outside a condition block', () => {
  it('substitutes the flag value', () => {
    const out = engine.processFlagConditions(
      "Hello {% _flag 'name' %}!",
      { '_flag.name': 'World' }
    );
    expect(out).toBe('Hello World!');
  });

  it('substitutes empty string when variable is missing', () => {
    const out = engine.processFlagConditions(
      "Hello {% _flag 'unset' %}!",
      {}
    );
    expect(out).toBe('Hello !');
  });
});

describe('condition block edge cases', () => {
  it('returns empty string when no case matches', () => {
    const tpl = [
      "{% _flag.condition('x') %}",
      ' - x: undefined',
      '     message: <p>Empty</p>',
      '{% end %}',
    ].join('\n');
    const out = engine.processFlagConditions(tpl, { '_flag.x': 'has-value' });
    expect(out.trim()).toBe('');
  });

  it('top-level else wins when no other case matches', () => {
    const tpl = [
      "{% _flag.condition('x') %}",
      ' - else:',
      '     message: <p>fallback</p>',
      '{% end %}',
    ].join('\n');
    const out = engine.processFlagConditions(tpl, { '_flag.x': 'anything' });
    expect(out.trim()).toBe('<p>fallback</p>');
  });

  it('comment lines are ignored', () => {
    const tpl = [
      "{% _flag.condition('x') %}",
      ' - x: {flagged}',
      '     comment: this should be ignored',
      '     message: <p>flagged</p>',
      '{% end %}',
    ].join('\n');
    const out = engine.processFlagConditions(tpl, { '_flag.x': 'v' });
    expect(out.trim()).toBe('<p>flagged</p>');
  });

  it('handles multiple condition blocks in one template', () => {
    const tpl = [
      "{% _flag.condition('a') %}",
      ' - a: undefined',
      '     message: A-empty',
      ' - else:',
      '     message: A-set',
      '{% end %}',
      '|',
      "{% _flag.condition('b') %}",
      ' - b: undefined',
      '     message: B-empty',
      ' - else:',
      '     message: B-set',
      '{% end %}',
    ].join('\n');
    const out = engine.processFlagConditions(tpl, {
      '_flag.a': 'x',
      '_flag.b': '',
    });
    expect(trim(out)).toBe('A-set | B-empty');
  });
});
