// send
// Send Emails using data specified from batch.

// Global variables.
var fs = require('fs');
var emailText = fs.readFileSync("CH-EMAILTEXT", "utf8");
var userName = "name@site.com";

var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport({
 service: "gmail",
 auth: {
  user: userName,
  pass: "password"
 }
});

var mailOptions = {
 to: "CH-EMAILTO",
 bcc: "name@site.com, name@site.com",
 from: userName,
 replyTo: userName,
 subject: "CH-SUBJECT",
 html: emailText,

 attachments: [
  {
   filename: 'CH-FILENAME_1',
   path: 'attachments/CH-FILENAME-1'
  },
  {
   filename: 'CH-IMG_1',
   path: 'img/CH-IMG-1',
   contentDisposition: "inline",
   cid: userName
  },
  {
   filename: 'CH-IMG_2',
   path: 'img/CH-IMG-2',
   contentDisposition: "inline",
   cid: userName
  },
  {
   filename: 'CH-IMG_3',
   path: 'img/CH-IMG-3',
   contentDisposition: "inline",
   cid: userName
  }
 ]

};

transporter.sendMail(mailOptions,
 function(err,info) {
  if (err) {console.log(err)}
  else {
   console.log("HTML Email Sent: " + info);
  }
 })
