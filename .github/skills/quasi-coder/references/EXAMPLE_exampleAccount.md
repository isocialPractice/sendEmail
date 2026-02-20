# Example Account Configuration

()=> ```js
// exampleAccount
// Account configuration file to use for sendEmail.js.

var nodemailer = require("nodemailer");
export var transporter = nodemailer.createTransport({
 service: "gmail",
 auth: {
  user: "name@site.com",
  pass: "password"
 }
});
```