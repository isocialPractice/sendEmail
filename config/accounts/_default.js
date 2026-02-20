// exampleAccount
// Account configuration file to use for sendEmail.js.

var nodemailer = require("nodemailer");
export var transporter = nodemailer.createTransport({
 service: "",
 host: "",
 port: 587,
 auth: {
  user: "",
  pass: ""
 }
});
