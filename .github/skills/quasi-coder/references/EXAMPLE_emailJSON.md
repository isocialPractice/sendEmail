# Example `email.json` Template

Below is an `email.json` example that works as a template

()=>```js
 // email
 // JSON configuration for a email.
 
 {
  "to": "CHANGE_SEND_TO",
  "bcc": "CHANGE_BCC",
()=>  "from": using config/accounts/<accountName>.js,
()=>  "replyTo": default to using config/accounts/<accountName>.js if not set here,
  "subject": "CHANGE_MESSAGE_HEADER",
()=>  "html" | "text"()->(property name "text" not sure about): <fileName>.ext in `this.html` folder or `this.data` folder | [ array of <fileName>.ext in `this.html` folder or `this.data` folder ]
()=> example html array-> "html": ["fileName_a.htm", "fileName_b.htm"] // if array the value of the file name will be passed as string with the flag of either --html-message "fileName_a" which would be in `html/fileName_a.htm`, or if raw text email then --text-message "fileName_a" which would be in `data/fileName_a.txt`,
()=> "attachments": emailAttachments | globalAttachments | emailAttachments + globalAttachments[i] -> i = regEx [0-9]+
}
```