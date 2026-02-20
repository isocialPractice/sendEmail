// email
// Email configuration for attachments and assets embedded in email.

import { global as global } from "../../globals/footer/global";
export var emailAttachments =  [
 {
  filename: 'Billing Statement.pdf',
  path: 'attachments/Billing Statement.pdf'
 },
 {
  filename: 'img.jpg',
  path: 'img/img.jpg',
  contentDisposition: "inline",
  cid: userName
 },
()=> global[0],
// comment for example, but this would expand to:
/* ()=> see file "../../globals/footer/global.js"
{
  filename: 'Logo',
  path: 'img/logo.jpg',
  contentDisposition: "inline",
  cid: userName
}
*/
()=> global[1]
// comment for example, but this would expand to:
/* ()=> see file "../../globals/footer/global.js"
{
  filename: 'Map',
  path: 'img/map.jpg',
  contentDisposition: "inline",
  cid: userName
}
*/
];