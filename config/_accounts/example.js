// example.js
// Example email account configuration.
// Copy this file to _default.js and fill in your credentials.
//
// IMPORTANT: Never commit credentials to version control.
// Add config/accounts/_default.js to your .gitignore.
//
// This file supports two formats:
//
// FORMAT A (Recommended): Export an 'account' config object.
// The engine creates the nodemailer transporter automatically.
//
// FORMAT B (Legacy): Export a nodemailer 'transporter' directly.
// This is still supported for backwards compatibility.

// ── FORMAT A: Account Config Object (Recommended) ────────────────────────────
// Uncomment and fill in your credentials:

// import nodemailer from 'nodemailer';
//
// export const account = {
//   service: 'gmail',  // 'gmail', 'outlook', 'yahoo', etc.
//   auth: {
//     user: 'your@gmail.com',
//     pass: 'your-app-password',  // Use App Password for Gmail (not account password)
//   },
// };

// For custom SMTP servers:
// export const account = {
//   host: 'smtp.yourprovider.com',
//   port: 587,
//   secure: false,  // false = STARTTLS (port 587), true = TLS (port 465)
//   auth: {
//     user: 'your@email.com',
//     pass: 'your-password',
//   },
// };

// ── FORMAT B: Legacy Nodemailer Transporter ───────────────────────────────────
// Still supported. Uncomment and fill in:

import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'name@site.com',
    pass: 'password',
  },
});
