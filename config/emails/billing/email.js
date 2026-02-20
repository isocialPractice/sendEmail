// email.js
// Attachment configuration for the 'billing' email template.
// Imports shared global footer attachments.

import { globalAttachments as footerAttachments } from '../../globals/footer/global.js';

export const emailAttachments = [
  {
    filename: 'Billing Statement.pdf',
    path: 'attachments/Billing Statement.pdf',
  },
  {
    filename: 'img.jpg',
    path: 'img/img.jpg',
    contentDisposition: 'inline',
    cid: 'img@billing.local',
  },
  // Include footer global attachments (logo, map)
  ...footerAttachments,
];
