// _default.js
// Mock account for integration tests.
// Points to the MockSmtpServer running on 127.0.0.1:2525.
// Do NOT use real credentials here.

export const account = {
  host: '127.0.0.1',
  port: 2525,
  secure: false,
  auth: {
    user: 'test@localhost.test',
    pass: 'testpassword123',
  },
  tls: { rejectUnauthorized: false },
};
