# Example `email.js` Ready

Below is and example of a `email.js` with ready data.

()=>```js
// email
// Email configuration for attachments and assets embedded in email.

export var emailAttachments =  [
 {
  filename: 'Annual Report.pdf',
  path: 'attachments/Annual Report.pdf'
 },
 {
  filename: 'logo',
  path: 'img/logo.png',
  contentDisposition: "inline",
  cid: 'logo@example.com'
 },
 {
  filename: 'screenshot',
  path: 'img/screenshot.jpg',
  contentDisposition: "inline",
  cid: 'screenshot@example.com'
 },
 {
  filename: 'thanksSmileyFace.svg',
  path: 'img/thanksSmileyFace.svg',
  contentDisposition: "inline",
  cid: 'thanksSmileyFace@example.com'
 }
];
```


