/**
 * markdown-html.test.ts
 * Unit tests for the Markdown to HTML converter.
 */

import { describe, it, expect } from 'vitest';
import { markdownToHtml, wrapHtmlForEmail } from '../../src/utils/markdown-html.js';

describe('markdownToHtml', () => {
  it('converts a heading to h1', async () => {
    const result = await markdownToHtml('# Hello World');
    expect(result).toContain('<h1');
    expect(result).toContain('Hello World');
  });

  it('converts bold text', async () => {
    const result = await markdownToHtml('**bold text**');
    expect(result).toContain('<strong>bold text</strong>');
  });

  it('converts a paragraph', async () => {
    const result = await markdownToHtml('This is a paragraph.');
    expect(result).toContain('<p>');
    expect(result).toContain('This is a paragraph.');
  });

  it('converts a link with target="_blank"', async () => {
    const result = await markdownToHtml('[Click here](https://example.com)');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('target="_blank"');
  });

  it('converts a list', async () => {
    const result = await markdownToHtml('- item one\n- item two\n- item three');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
    expect(result).toContain('item one');
  });
});

describe('wrapHtmlForEmail', () => {
  it('wraps a fragment in a full HTML document', () => {
    const result = wrapHtmlForEmail('<p>Hello</p>');
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<body');
    expect(result).toContain('<p>Hello</p>');
  });

  it('does not double-wrap a full HTML document', () => {
    const fullDoc = '<!DOCTYPE html><html><body>Test</body></html>';
    const result = wrapHtmlForEmail(fullDoc);
    expect(result).toBe(fullDoc);
  });

  it('includes the title when provided', () => {
    const result = wrapHtmlForEmail('<p>Content</p>', 'My Email');
    expect(result).toContain('<title>My Email</title>');
  });
});
