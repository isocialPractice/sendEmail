// email.js
// Attachment configuration for the 'example' email template.
// This file exports an 'emailAttachments' array of attachment objects.
//
// Each attachment:
//   filename         - the name shown in the email client
//   path             - file path (relative to sendEmail root, or absolute)
//   contentDisposition - 'attachment' (download) or 'inline' (embedded)
//   cid              - Content-ID for inline images: <img src="cid:logo@example.com">

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
];
