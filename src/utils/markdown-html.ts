/**
 * markdown-html.ts
 * Lightweight Markdown to HTML converter using the 'marked' library.
 * Configured for email-safe HTML output (no external stylesheets, no JavaScript).
 */

import { marked, Renderer } from 'marked';

/**
 * Convert a Markdown string to email-safe HTML.
 * - Inline styles instead of class-based CSS
 * - No external stylesheet references
 * - No JavaScript
 *
 * Uses the marked v12 renderer API (individual string parameters).
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const renderer = new Renderer();

  // Override link renderer - make links open in new tab (email-safe)
  renderer.link = (href: string, title: string | null | undefined, text: string): string => {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  // Override image renderer - email clients handle src differently
  renderer.image = (href: string, title: string | null | undefined, text: string): string => {
    const titleAttr = title ? ` title="${title}"` : '';
    return `<img src="${href}" alt="${text}"${titleAttr} style="max-width:100%;" />`;
  };

  // Override heading to add basic inline styles
  renderer.heading = (text: string, depth: number): string => {
    const sizes: Record<number, string> = {
      1: '24px',
      2: '20px',
      3: '18px',
      4: '16px',
      5: '14px',
      6: '12px',
    };
    const size = sizes[depth] ?? '16px';
    return `<h${depth} style="font-size:${size};margin:16px 0 8px 0;">${text}</h${depth}>\n`;
  };

  marked.use({ renderer });

  const html = await marked.parse(markdown);
  return html;
}

/**
 * Wrap HTML content in a minimal email-safe wrapper if not already a full document.
 */
export function wrapHtmlForEmail(html: string, title?: string): string {
  if (html.trim().toLowerCase().startsWith('<!doctype') ||
      html.trim().toLowerCase().startsWith('<html')) {
    return html;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${title ? `<title>${title}</title>` : ''}
</head>
<body style="font-family:Arial,sans-serif;font-size:14px;color:#333;margin:0;padding:16px;">
${html}
</body>
</html>`;
}
