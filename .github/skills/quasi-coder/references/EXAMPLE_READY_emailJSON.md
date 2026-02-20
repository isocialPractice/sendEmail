 // email
 // JSON configuration for a email.
 
 {
  "to": "jane@example.com",
  "bcc": "steve@example.com",
  "from": "john@site.com",
  "replyTo": ["john@site.com", "jane@site.com"],
  "subject": "Billing Statement",
  "html": "billingStatement.htm",
()=>  "attachments": emailAttachments + globalAttglobalAttachments[0]
()=> so from `EXAMPLE_READY_email.md` all attachments, expanding to:
()=>```
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
```
()=> and from `EXAMPLE_READY_global.md` attachment at index `0`, expanding to:
()=>```
 {
  filename: 'logo',
  path: 'img/logo.png',
  contentDisposition: "inline",
  cid: 'logo@example.com'
 }
```
}
