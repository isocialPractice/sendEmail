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
// Custom Variables for email.json
// ═══════════════════════════════════════════════════════════════════════════
// Export 'emailVars' to define custom template variables that can be used in
// the sibling email.json file. These variables can contain template syntax
// themselves and will be substituted when email.json is loaded.
//
// Example:
//   export const emailVars = {
//     reportType: 'Monthly',
//     theYear: date.getMonth() === 0 ? '{{dates.lastYear}}' : '{{dates.year}}'
//   };
//
// Then in email.json:
//   "subject": "{{reportType}} Report - {{dates.lastMonth}} {{theYear}}"
//
// ═══════════════════════════════════════════════════════════════════════════

// Example: Conditional year variable for January reports
// In January, use previous year; otherwise use current year
var theYear;
var date = new Date();
var monthCheck = date.getMonth();
if (monthCheck === 0) {
  theYear = '{{dates.lastYear}}';
} else {
  theYear = '{{dates.year}}';
}

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
  // Example using custom variable:
  // {
  //   filename: 'Report - {{dates.lastMonth}} ' + theYear + '.pdf',
  //   path: 'reports/' + theYear + '/{{dates.lastMonth}}-inventory.pdf',
  // },
];

// Export custom variables for use in email.json
export const emailVars = {
  theYear,
  reportType: 'Monthly',
};
