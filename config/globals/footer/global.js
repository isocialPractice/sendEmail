// global.js
// Global attachment configuration for the footer template.
// These attachments (logo, map) are shared across multiple email templates.

export const globalAttachments = [
  {
    filename: 'Logo',
    path: 'img/logo.jpg',
    contentDisposition: 'inline',
    cid: 'logo@footer.local',
  },
  {
    filename: 'Map',
    path: 'img/map.jpg',
    contentDisposition: 'inline',
    cid: 'map@footer.local',
  },
];
