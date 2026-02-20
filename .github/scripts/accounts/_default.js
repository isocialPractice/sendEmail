// _default.js
// Default email account configuration.
// This file is REQUIRED. sendEmail uses it when no --account option is specified.
//
// IMPORTANT: Fill in your actual credentials.
// IMPORTANT: Never commit this file with real credentials to version control.
//
// For Gmail: Use an App Password (requires 2FA).
//   Go to: Google Account > Security > 2-Step Verification > App Passwords

import nodemailer from 'nodemailer';

// 컴 FORMAT A: Account Config Object (Recommended) 컴컴컴컴컴컴컴컴컴컴컴컴컴컴
// Use this format for clean configuration:

// export const account = {
//   service: 'gmail',
//   auth: {
//     user: 'your@gmail.com',
//     pass: 'your-app-password',
//   },
// };

// 컴 FORMAT B: Legacy Nodemailer Transporter 컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴컴�
// The engine supports this format for backwards compatibility:

export const transporter = nodemailer.createTransport({
  service: '',       // e.g. 'gmail', 'outlook'
  host: '',          // e.g. 'smtp.gmail.com' (optional if service is set)
  port: 587,
  secure: false,     // false = STARTTLS, true = TLS
  auth: {
    user: '',        // Your email address
    pass: '',        // Your app password or account password
  },
});
