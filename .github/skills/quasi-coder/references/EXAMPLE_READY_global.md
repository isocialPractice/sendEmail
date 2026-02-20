# Example `global.js` Ready

Below is and example of a `global.js` with ready data.

()=>```js
// global
// Global configuration for commonly used email attachments and assets embedded in an email.

export var globalAttachments =  [
 {
  filename: 'logo',
  path: 'img/logo.png',
  contentDisposition: "inline",
  cid: 'logo@example.com'
 },
 {
  filename: 'map',
  path: 'img/map.jpg',
  contentDisposition: "inline",
  cid: 'map@example.com'
 }
];
```

