# Example `email.js` Template

Below is and example of an `email.js` that works as a template.

()=>```js
// email
// Email configuration for attachments and assets embedded in email.

export var email =  [
 {
  filename: 'CH-FILENAME_1',
  path: 'attachments/CH-FILENAME-1'
 },
 {
  filename: 'CH-IMG_1',
  path: 'img/CH-IMG-1',
  contentDisposition: "inline",
  cid: `${filename}@example.com`
 },
 {
  filename: 'CH-IMG_2',
  path: 'img/CH-IMG-2',
  contentDisposition: "inline",
  cid: `${filename}@example.com`
 },
 {
  filename: 'CH-IMG_3',
  path: 'img/CH-IMG-3',
  contentDisposition: "inline",
  cid: `${filename}@example.com`
 }
];
```
