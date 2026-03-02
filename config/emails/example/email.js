// email.js
// Attachment configuration for the 'example' email template.
// This file exports an 'emailAttachments' array of attachment objects.
//
// Each attachment:
//   filename         - the name shown in the email client
//   path             - file path (relative to sendEmail root, or absolute)
//   contentDisposition - 'attachment' (download) or 'inline' (embedded)
//   cid              - Content-ID for inline images: <img src="cid:logo@example.com">
//
// ═══════════════════════════════════════════════════════════════════════════
// Template Variables in Attachments
// ═══════════════════════════════════════════════════════════════════════════
// You can use {{variable}} syntax in filename and path properties:
//
//   filename: 'Report-{{dates.lastMonth}}-{{dates.year}}.pdf'
//   path: 'attachments/{{dates.year}}/report.pdf'
//
// Available date variables:
//   {{dates.lastMonth}}  - Previous month name (e.g., "January")
//   {{dates.month}}      - Current month name (e.g., "February")
//   {{dates.year}}       - Current year (e.g., "2026")
//   {{dates.lastYear}}   - Previous year (e.g., "2025")
//   {{dates.quarter}}    - Current quarter (1-4)
//   {{dates.day}}        - Day of month (e.g., "15")
//   ... and more (see docs/TEMPLATING.md for full list)
//
// ═══════════════════════════════════════════════════════════════════════════

export const emailAttachments = [
  {
    filename: 'CH-FILENAME_1',
    path: 'attachments/CH-FILENAME-1',
  },
  {
    filename: 'CH-IMG_1',
    path: 'img/CH-IMG-1',
    contentDisposition: 'inline',
    cid: 'img1@example.com',
  },
  // Example with date templating:
  // {
  //   filename: 'Monthly Report - {{dates.lastMonth}} {{dates.year}}.pdf',
  //   path: 'attachments/reports/{{dates.year}}/{{dates.month}}-report.pdf',
  // },
];

