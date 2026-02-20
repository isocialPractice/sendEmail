// sendEmail
// NodeJS for sendEmail application.

// Import local and nodeJS tools.
var fs = require('fs');
()=> var transporter = require('./config/accounts/exampleAccount.js');
()=> var email | global = require('./config/emails/<emailName>/email.js') | require('./config/globals/<globalName>/global.js'); // conditional defition value ordered respective to variable name

// Global variables
()=> var emailText = fs.readFileSync("CHANGE_MESSAGE_FILE", "utf8") | data from <email.json>;
var fromAddress = transporter.auth.user; // this comes from configurred account
var replyTo = fromAddress; // default to this

var mailOptions = {
 to: "CHANGE_SEND_TO", // use raw data from option or flag, or from <email.json> or a <emailList.json>
 bcc: "CHANGE_BCC",    // raw data from option or flag, or from <email.json> or a <bccEmailList.json>
 from: fromAddress,    // from config account file
 replyTo: replyTo,     // defaults to same value as from Address, which is from <email.json> or a config account file
 subject: "CHANGE_MESSAGE_HEADER", // raw data from option or flag, or from a <email.json>
 html: emailText,                  // raw data or a template file from option or flag, or from a <email.json>
 attachments: [                    // from an <email.js> or a <global.js>
  ()=> imported data from <email.js> or a <global.js>
 ]
};

transporter.sendMail(mailOptions,
 function(err,info) {
  if (err) {console.log(err)}
  else {
   console.log("HTML Email Sent: " + info);
  }
 })
